import { create } from "zustand";
import { useRideLifecycle, type MatchedDriver } from "../../rides/hooks/useRideLifecycle";
import {
  supabase,
  getSession,
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendTextMessage,
  sendOffer as persistOffer,
  respondToOffer,
  agreeOnFare,
  searchRegisteredUsers,
  createNotification,
  type ConversationRow,
  type MessageRow,
  type PublicUserSearchRow,
} from "../../../shared/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
export type NegotiationStatus = "REQUESTED" | "NEGOTIATING" | "AGREED" | "COMPLETED" | "CANCELLED";

export interface ChatMessage {
  id: string;
  sender: "self" | "driver" | "system";
  text?: string;
  offerAmount?: number;
  offerType?: "your" | "counter";
  offerStatus?: "PENDING" | "COUNTERED" | "ACCEPTED" | "DECLINED";
  offerDetails?: {
    pickup: string;
    dropoff: string;
    passengers: number;
  };
  time: string;
}

export interface Conversation {
  id: string;                  // Conversation row id
  driverId: string;
  riderId: string;
  driverInitials: string;
  driverName: string;
  vehicle: string;
  plate: string;
  rating: number;
  status: NegotiationStatus;
  lastMessage: string;
  timeAgo: string;
  pickup: string;
  dropoff: string;
  price: string;
  distance: string;
  messages: ChatMessage[];
  requestCount?: number;
  cooldownUntil?: number | null;
}

interface ChatState {
  conversations: Conversation[];
  activeConvId: string | null;
  isLoading: boolean;
  searchResults: PublicUserSearchRow[];

  // Actions
  setActiveConv: (id: string) => void;
  setSearchResults: (results: PublicUserSearchRow[]) => void;
  refreshConversations: () => Promise<void>;
  sendMessage: (convId: string, text: string) => Promise<void>;
  sendOffer: (convId: string, amount: number, details?: { pickup: string; dropoff: string; passengers: number }) => Promise<void>;
  confirmOffer: (convId: string, amount: number) => Promise<void>;
  declineOffer: (convId: string) => Promise<void>;
  sendRequest: (target: PublicUserSearchRow, mode: "RIDER" | "DRIVER") => Promise<void>;
  acceptRequest: (convId: string) => Promise<void>;
  declineRequest: (convId: string) => Promise<void>;
  searchContacts: (query: string, mode: "RIDER" | "DRIVER") => Promise<void>;
  closeConversation: (convId: string) => Promise<void>;
  closedConvAlert: string | null;
  clearClosedConvAlert: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const now = () =>
  new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

const formatVehicle = (vehicle?: string | null, vehicleType?: string | null) => {
  const trimmedVehicle = vehicle?.trim();
  const trimmedType = vehicleType?.trim();
  if (trimmedVehicle && trimmedType) return `${trimmedVehicle} · ${trimmedType}`;
  if (trimmedVehicle) return trimmedVehicle;
  if (trimmedType) return trimmedType;
  return "Vehicle info unavailable";
};

const getInitials = (name: string) =>
  name.split(" ").map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase() || "DR";

const getConversationPairKey = (riderId: string, driverId: string) => `${riderId}:${driverId}`;

const getRequestCooldownKey = (riderId: string, driverId: string) => `messages-request-cooldown:${getConversationPairKey(riderId, driverId)}`;

const readRequestCooldown = (riderId: string, driverId: string) => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(getRequestCooldownKey(riderId, driverId));
  if (!raw) return null;
  const timestamp = Number.parseInt(raw, 10);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const writeRequestCooldown = (riderId: string, driverId: string, until: number) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getRequestCooldownKey(riderId, driverId), String(until));
};

const isMissingChatTableError = (error: { message?: string } | null | undefined) => {
  const message = error?.message ?? "";
  return message.includes("schema cache") || message.includes("public.conversations") || message.includes("public.messages");
};

const parseOfferDetails = (content: string): ChatMessage["offerDetails"] | undefined => {
  try {
    const parsed = JSON.parse(content) as Partial<{ pickup: string; dropoff: string; passengers: number }> & { amount?: number };
    if (typeof parsed.pickup === "string" && typeof parsed.dropoff === "string" && typeof parsed.passengers === "number") {
      return {
        pickup: parsed.pickup,
        dropoff: parsed.dropoff,
        passengers: parsed.passengers,
      };
    }
  } catch {
    return undefined;
  }
  return undefined;
};

const mapConversationRowToConversation = (
  row: ConversationRow,
  userMap: Map<string, { full_name?: string | null; vehicle?: string | null; vehicle_type?: string | null; driver_plate_number?: string | null; rating?: number | null }>,
  currentUserId: string | null,
  messages: ChatMessage[] = []
): Conversation => {
  const driver = userMap.get(row.driver_id) ?? {};
  const latestMessage = messages.at(-1);
  const driverName = driver.full_name?.trim() || "Driver";
  const cooldownUntil = row.status === "CANCELLED"
    ? readRequestCooldown(row.rider_id, row.driver_id)
    : null;
  const lastMessage = latestMessage
    ? latestMessage.text ?? (latestMessage.offerAmount != null ? `₱${latestMessage.offerAmount.toFixed(2)}` : row.status)
    : row.status;

  return {
    id: row.id,
    driverId: row.driver_id,
    riderId: row.rider_id,
    driverInitials: getInitials(driverName),
    driverName,
    vehicle: formatVehicle(driver.vehicle, driver.vehicle_type),
    plate: driver.driver_plate_number?.trim() || "—",
    rating: driver.rating ?? 0,
    status: (row.status ?? "NEGOTIATING") as NegotiationStatus,
    lastMessage,
    timeAgo: row.last_message_at ? new Date(row.last_message_at).toLocaleTimeString() : "",
    pickup: row.pickup ?? "",
    dropoff: row.dropoff ?? "",
    price: row.agreed_fare != null ? `₱${row.agreed_fare.toFixed(2)}` : row.status,
    distance: "—",
    messages,
    requestCount: row.status === "REQUESTED"
      ? messages.filter((message) => message.sender === (row.rider_id === currentUserId ? "self" : "driver") && message.text).length
      : 0,
    cooldownUntil,
  };
};

let currentUserId: string | null = null;
let realtimeMessagesChannel: ReturnType<typeof supabase.channel> | null = null;
let realtimeConversationsChannel: ReturnType<typeof supabase.channel> | null = null;
let chatPollId: ReturnType<typeof setInterval> | null = null;
let chatInitializationStarted = false;
let messagingBackendAvailable = true;
const LOCAL_CHAT_STORAGE_KEY = "unilift-local-chat-state";

type LocalChatSnapshot = {
  conversations: Conversation[];
};

const readLocalChatSnapshot = (): LocalChatSnapshot => {
  if (typeof window === "undefined") return { conversations: [] };
  try {
    const raw = window.localStorage.getItem(LOCAL_CHAT_STORAGE_KEY);
    if (!raw) return { conversations: [] };
    const parsed = JSON.parse(raw) as LocalChatSnapshot;
    return { conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [] };
  } catch {
    return { conversations: [] };
  }
};

const writeLocalChatSnapshot = (conversations: Conversation[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_CHAT_STORAGE_KEY, JSON.stringify({ conversations }));
};

const upsertLocalConversation = (conversation: Conversation) => {
  const snapshot = readLocalChatSnapshot();
  const conversations = snapshot.conversations.some((item) => item.id === conversation.id)
    ? snapshot.conversations.map((item) => (item.id === conversation.id ? conversation : item))
    : [conversation, ...snapshot.conversations];
  writeLocalChatSnapshot(conversations);
  return conversations;
};

const updateLocalConversation = (conversationId: string, updater: (conversation: Conversation) => Conversation) => {
  const snapshot = readLocalChatSnapshot();
  const conversations = snapshot.conversations.map((conversation) =>
    conversation.id === conversationId ? updater(conversation) : conversation
  );
  writeLocalChatSnapshot(conversations);
  return conversations;
};

const cloneConversation = (conversation: Conversation): Conversation => ({
  ...conversation,
  messages: conversation.messages.map((message) => ({ ...message, offerDetails: message.offerDetails ? { ...message.offerDetails } : undefined })),
});

const detectMissingChatSchema = async () => {
  const { error } = await supabase.from("conversations").select("id").limit(1);
  if (error && isMissingChatTableError(error)) {
    messagingBackendAvailable = false;
    return true;
  }
  messagingBackendAvailable = true;
  return false;
};

const ensureCurrentUserId = async () => {
  if (currentUserId) return currentUserId;
  const session = await getSession();
  currentUserId = session?.user?.id ?? null;
  return currentUserId;
};

const mapMessageRowToChatMessage = (
  row: MessageRow,
  conversation: ConversationRow,
  currentUserId: string | null
): ChatMessage => {
  const isSelf = currentUserId != null && row.sender_id === currentUserId;
  // "other party" = either participant who isn't the current user
  const isOtherParticipant = !isSelf && (
    row.sender_id === conversation.driver_id || row.sender_id === conversation.rider_id
  );
  const offerDetails = row.type === "offer" ? parseOfferDetails(row.content) : undefined;
  return {
    id: row.id,
    sender: row.type === "system" ? "system" : isSelf ? "self" : isOtherParticipant ? "driver" : "system",
    text: row.type === "text" || row.type === "system" ? row.content : undefined,
    offerAmount: row.offer_amount ?? undefined,
    offerType: row.type === "offer" ? (isSelf ? "your" : "counter") : undefined,
    offerStatus: row.offer_status ?? undefined,
    offerDetails,
    time: row.sent_at ? new Date(row.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : now(),
  };
};

const mergeConversationMessage = (
  state: ChatState,
  convId: string,
  message: ChatMessage,
  statusOverride?: NegotiationStatus
): ChatState => ({
  ...state,
  conversations: state.conversations.map((conversation) => {
    if (conversation.id !== convId) return conversation;
    if (conversation.messages.some((existing) => existing.id === message.id)) {
      return {
        ...conversation,
        status: statusOverride ?? conversation.status,
      };
    }

    const nextMessages = [...conversation.messages, message];
    const nextLastMessage = message.text ?? (message.offerAmount != null ? `₱${message.offerAmount.toFixed(2)}` : conversation.lastMessage);

    return {
      ...conversation,
      status: statusOverride ?? conversation.status,
      messages: nextMessages,
      lastMessage: nextLastMessage,
      timeAgo: "now",
    };
  }),
});

const upsertConversationInState = (
  state: ChatState,
  conversation: Conversation
): ChatState => {
  const existingIndex = state.conversations.findIndex((item) => item.id === conversation.id);
  if (existingIndex === -1) {
    return { ...state, conversations: [conversation, ...state.conversations] };
  }

  return {
    ...state,
    conversations: state.conversations.map((item) => (item.id === conversation.id ? conversation : item)),
  };
};

// ─── Store ────────────────────────────────────────────────────────────────────
export const useChat = create<ChatState>()((set, get) => ({
  conversations: [],
  activeConvId: null,
  isLoading: true,
  searchResults: [],

  setActiveConv: (id) => set({ activeConvId: id }),

  setSearchResults: (results) => set({ searchResults: results }),

  refreshConversations: async () => {
    const userId = await ensureCurrentUserId();
    if (!userId) {
      set({ conversations: [], activeConvId: null, isLoading: false });
      return;
    }

    if (await detectMissingChatSchema()) {
      const localSnapshot = readLocalChatSnapshot();
      const conversations = localSnapshot.conversations.map(cloneConversation);
      set({
        conversations,
        activeConvId: conversations.find((conversation) => conversation.id === get().activeConvId)?.id ?? conversations[0]?.id ?? null,
        isLoading: false,
      });
      return;
    }

    if (!messagingBackendAvailable) {
      const localSnapshot = readLocalChatSnapshot();
      const conversations = localSnapshot.conversations.map(cloneConversation);
      set({
        conversations,
        activeConvId: conversations.find((conversation) => conversation.id === get().activeConvId)?.id ?? conversations[0]?.id ?? null,
        isLoading: false,
      });
      return;
    }

    let conversationRows = await getConversations(userId);
    // If we received no rows, perform a lightweight check for RLS/permission errors
    // and fall back to the local snapshot if Supabase denies access.
    if ((!conversationRows || conversationRows.length === 0)) {
      try {
        const test = await supabase.from("conversations").select("id").limit(1);
        if (test.error) {
          const msg = String(test.error.message ?? "").toLowerCase();
          if (msg.includes("row-level security") || msg.includes("permission") || (test.error as any).status === 403) {
            messagingBackendAvailable = false;
            const localSnapshot = readLocalChatSnapshot();
            const conversations = localSnapshot.conversations.map(cloneConversation);
            set({
              conversations,
              activeConvId: conversations.find((conversation) => conversation.id === get().activeConvId)?.id ?? conversations[0]?.id ?? null,
              isLoading: false,
            });
            return;
          }
        }
      } catch (e) {
        // ignore and continue — if test fails, fall back to empty handling below
      }
    }
    const participantIds = Array.from(new Set(conversationRows.flatMap((row) => [row.driver_id, row.rider_id])));
    const { data: profiles } = await supabase
      .from("users")
      .select("id, full_name, vehicle, vehicle_type, driver_plate_number, rating")
      .in("id", participantIds);

    const userMap = new Map(
      (profiles ?? []).map((profile: any) => [profile.id, profile as { full_name?: string | null; vehicle?: string | null; vehicle_type?: string | null; driver_plate_number?: string | null; rating?: number | null }])
    );

    const conversations = await Promise.all(
      conversationRows.map(async (row) => {
        const messageRows = await getMessages(row.id);
        const messages = messageRows.map((messageRow) => mapMessageRowToChatMessage(messageRow, row, userId));
        return mapConversationRowToConversation(row, userMap, userId, messages);
      })
    );

    set({
      conversations,
      activeConvId: conversations.find((conversation) => conversation.id === get().activeConvId)?.id ?? conversations[0]?.id ?? null,
      isLoading: false,
    });
  },

  searchContacts: async (query, mode) => {
    const results = await searchRegisteredUsers(query);
    const userId = currentUserId ?? (await ensureCurrentUserId());
    const filtered = userId ? results.filter((result) => result.id !== userId) : results;
    set({ searchResults: filtered });
  },

  sendRequest: async (target, mode) => {
    const userId = await ensureCurrentUserId();
    if (!userId) return;

    const riderId = mode === "RIDER" ? userId : target.id;
    const driverId = mode === "RIDER" ? target.id : userId;
    const existing = await getOrCreateConversation(riderId, driverId);
    if (!existing) {
      messagingBackendAvailable = false;
      const localConversation: Conversation = {
        id: `local-${riderId}-${driverId}`,
        riderId,
        driverId,
        driverInitials: target.full_name ? getInitials(target.full_name) : getInitials(target.id),
        driverName: target.full_name,
        vehicle: target.vehicle ?? "",
        plate: target.role === "DRIVER" ? (target.vehicle_type ?? "") : "",
        rating: target.rating ?? 0,
        status: "REQUESTED",
        lastMessage: "Request sent. Waiting for response.",
        timeAgo: "now",
        pickup: "Search to start a request thread",
        dropoff: "Select a destination",
        price: "",
        distance: "",
        messages: [],
        requestCount: 0,
        cooldownUntil: null,
      };
      const conversations = upsertLocalConversation(localConversation);
      set({ conversations, activeConvId: localConversation.id, isLoading: false });
      return;
    }

    const cooldownUntil = readRequestCooldown(riderId, driverId);
    if (existing.status === "CANCELLED" && cooldownUntil && cooldownUntil > Date.now()) return;

    const { error } = await supabase.from("conversations").update({ status: "REQUESTED" }).eq("id", existing.id);
    if (error) {
      messagingBackendAvailable = false;
      const localConversation: Conversation = {
        id: existing.id,
        riderId,
        driverId,
        driverInitials: target.full_name ? getInitials(target.full_name) : getInitials(target.id),
        driverName: target.full_name,
        vehicle: target.vehicle ?? "",
        plate: target.role === "DRIVER" ? (target.vehicle_type ?? "") : "",
        rating: target.rating ?? 0,
        status: "REQUESTED",
        lastMessage: "Request sent. Waiting for response.",
        timeAgo: "now",
        pickup: "Search to start a request thread",
        dropoff: "Select a destination",
        price: "",
        distance: "",
        messages: [],
        requestCount: 0,
        cooldownUntil: null,
      };
      const conversations = upsertLocalConversation(localConversation);
      set({ conversations, activeConvId: localConversation.id, isLoading: false });
      return;
    }
    const notificationTargetId = mode === "RIDER" ? target.id : userId;
    void createNotification(
      notificationTargetId,
      "New message request",
      `${mode === "RIDER" ? "A rider" : "A driver"} wants to start a conversation.`,
      { conversationId: existing.id, status: "REQUESTED" }
    );
    set({ activeConvId: existing.id });
    await get().refreshConversations();
    set({ activeConvId: existing.id });
  },

  acceptRequest: async (convId) => {
    const conversation = get().conversations.find((item) => item.id === convId);
    if (!conversation) return;

    const { error } = await supabase.from("conversations").update({ status: "NEGOTIATING" }).eq("id", convId);
    if (error) {
      messagingBackendAvailable = false;
      const conversations = updateLocalConversation(convId, (item) => ({ ...item, status: "NEGOTIATING", timeAgo: "now" }));
      set({ conversations, activeConvId: convId });
      return;
    }
    void createNotification(
      conversation.riderId,
      "Message request accepted",
      `${conversation.driverName} accepted your request. You can continue chatting now.`,
      { conversationId: convId, status: "NEGOTIATING" }
    );
    await get().refreshConversations();
  },

  declineRequest: async (convId) => {
    const conversation = get().conversations.find((item) => item.id === convId);
    if (!conversation) return;

    const cooldownUntil = Date.now() + 3 * 60 * 60 * 1000;
    writeRequestCooldown(conversation.riderId, conversation.driverId, cooldownUntil);
    const { error } = await supabase.from("conversations").update({ status: "CANCELLED" }).eq("id", convId);
    if (error) {
      messagingBackendAvailable = false;
      const conversations = updateLocalConversation(convId, (item) => ({ ...item, status: "CANCELLED", cooldownUntil, timeAgo: "now" }));
      set({ conversations, activeConvId: convId });
      return;
    }
    void createNotification(
      conversation.riderId,
      "Message request declined",
      `${conversation.driverName} declined your request. Try again after the cooldown period.`,
      { conversationId: convId, status: "CANCELLED", cooldownUntil }
    );
    await supabase.from("messages").insert({
      conversation_id: convId,
      sender_id: conversation.driverId,
      type: "system",
      content: "REQUEST DECLINED — retry after cooldown.",
    });
    await get().refreshConversations();
  },

  sendMessage: async (convId, text) => {
    const conversation = get().conversations.find((item) => item.id === convId);
    const senderId = await ensureCurrentUserId();
    if (!conversation || !senderId || !text.trim()) return;

    const priorSelfTextCount  = conversation.messages.filter((m) => m.sender === "self"   && m.text).length;
    const priorOtherTextCount = conversation.messages.filter((m) => m.sender === "driver" && m.text).length;
    const isRecipientFirstReply =
      conversation.status === "REQUESTED" && priorSelfTextCount === 0 && priorOtherTextCount > 0;

    if (conversation.status === "REQUESTED" && !isRecipientFirstReply && priorSelfTextCount >= 3) return;

    try {
      const inserted = await sendTextMessage(convId, senderId, text.trim());
      if (!inserted) {
        messagingBackendAvailable = false;
        const localMessage: ChatMessage = {
          id: `local-${Date.now()}`,
          sender: senderId === conversation.riderId ? "self" : "driver",
          text: text.trim(),
          time: now(),
        };
        const conversations = updateLocalConversation(convId, (item) => ({
          ...item,
          messages: [...item.messages, localMessage],
          lastMessage: localMessage.text ?? "",
          timeAgo: "now",
        }));
        set((state) => ({ ...state, conversations, activeConvId: convId }));
        return;
      }

      const mapped = mapMessageRowToChatMessage(
        inserted,
        {
          id: conversation.id,
          rider_id: conversation.riderId,
          driver_id: conversation.driverId,
          status: conversation.status,
          pickup: conversation.pickup || null,
          dropoff: conversation.dropoff || null,
          pickup_lat: null,
          pickup_lng: null,
          dropoff_lat: null,
          dropoff_lng: null,
          agreed_fare: conversation.price.startsWith("₱") ? Number.parseFloat(conversation.price.replace(/[^0-9.]/g, "")) : null,
          ride_id: null,
          last_message_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        senderId
      );

      set((state) => mergeConversationMessage(state, convId, mapped));

      if (isRecipientFirstReply) {
        const { error: acceptErr } = await supabase
          .from("conversations")
          .update({ status: "NEGOTIATING" })
          .eq("id", convId);

        if (!acceptErr) {
          const requesterId = senderId === conversation.riderId ? conversation.driverId : conversation.riderId;
          void createNotification(
            requesterId,
            "Message request accepted",
            `${conversation.driverName} replied — your conversation is now active.`,
            { conversationId: convId, status: "NEGOTIATING" }
          );
          set((state) => ({
            ...state,
            conversations: state.conversations.map((c) =>
              c.id === convId ? { ...c, status: "NEGOTIATING", timeAgo: "now" } : c
            ),
          }));
        }
      }
    } catch (err) {
      console.warn("sendMessage supabase error:", err);
    }
  },

  sendOffer: async (convId, amount, details) => {
    const conversation = get().conversations.find((item) => item.id === convId);
    const senderId = await ensureCurrentUserId();
    if (!conversation || !senderId) return;

    try {
      const inserted = await persistOffer(convId, senderId, amount, details);
      if (!inserted) {
        messagingBackendAvailable = false;
        const localMessage: ChatMessage = {
          id: `local-offer-${Date.now()}`,
          sender: senderId === conversation.riderId ? "self" : "driver",
          offerAmount: amount,
          offerType: senderId === conversation.riderId ? "your" : "counter",
          offerStatus: "PENDING",
          offerDetails: details,
          time: now(),
        };
        const conversations = updateLocalConversation(convId, (item) => ({
          ...item,
          messages: [...item.messages, localMessage],
          lastMessage: `₱${amount.toFixed(2)}`,
          timeAgo: "now",
        }));
        set((state) => ({ ...state, conversations, activeConvId: convId }));
        return;
      }

      const mapped = mapMessageRowToChatMessage(
        inserted,
        {
          id: conversation.id,
          rider_id: conversation.riderId,
          driver_id: conversation.driverId,
          status: conversation.status,
          pickup: conversation.pickup || null,
          dropoff: conversation.dropoff || null,
          pickup_lat: null,
          pickup_lng: null,
          dropoff_lat: null,
          dropoff_lng: null,
          agreed_fare: conversation.price.startsWith("₱") ? Number.parseFloat(conversation.price.replace(/[^0-9.]/g, "")) : null,
          ride_id: null,
          last_message_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        senderId
      );

      set((state) => mergeConversationMessage(state, convId, mapped));
    } catch (err) {
      console.warn("sendOffer supabase error:", err);
    }
  },

  confirmOffer: async (convId, amount) => {
    const conv = get().conversations.find((c) => c.id === convId);
    const senderId = await ensureCurrentUserId();
    if (!conv) return;

    try {
      await agreeOnFare(convId, amount);
      const { data: inserted, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: convId,
          sender_id: senderId ?? conv.driverId,
          type: "system",
          content: `RIDE AGREEMENT CONFIRMED — ₱${amount.toFixed(2)} | ${conv.pickup} → ${conv.dropoff}`,
        })
        .select()
        .single();

      if (!error && inserted) {
        const mapped = mapMessageRowToChatMessage(inserted as MessageRow, {
          id: conv.id,
          rider_id: conv.riderId,
          driver_id: conv.driverId,
          status: conv.status,
          pickup: conv.pickup || null,
          dropoff: conv.dropoff || null,
          pickup_lat: null,
          pickup_lng: null,
          dropoff_lat: null,
          dropoff_lng: null,
          agreed_fare: amount,
          ride_id: null,
          last_message_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }, senderId ?? conv.driverId);

        set((state) => mergeConversationMessage(state, convId, mapped, "AGREED"));
      } else {
        if (!inserted) {
          messagingBackendAvailable = false;
          const localSystemMsg: ChatMessage = {
            id: `local-confirm-${Date.now()}`,
            sender: "system",
            text: `RIDE AGREEMENT CONFIRMED — ₱${amount.toFixed(2)} | ${conv.pickup} → ${conv.dropoff}`,
            time: now(),
          };
          const conversations = updateLocalConversation(convId, (item) => ({
            ...item,
            status: "AGREED",
            price: `₱${amount.toFixed(2)}`,
            messages: [...item.messages, localSystemMsg],
            lastMessage: localSystemMsg.text ?? "",
            timeAgo: "now",
          }));
          set((state) => ({ ...state, conversations, activeConvId: convId }));
          return;
        }
        set((state) => ({
          ...state,
          conversations: state.conversations.map((conversation) =>
            conversation.id === convId
              ? { ...conversation, status: "AGREED", price: `₱${amount.toFixed(2)}` }
              : conversation
          ),
        }));
      }
    } catch (err) {
      console.warn("confirmOffer supabase error:", err);
    }

    // ── LIFECYCLE BRIDGE: advance both Rider → DRIVER_FOUND, Driver → EN_ROUTE ─
    const matchedDriver: MatchedDriver = {
      id:         conv.id,
      name:       conv.driverName,
      initials:   conv.driverInitials,
      vehicle:    conv.vehicle,
      plate:      conv.plate,
      rating:     conv.rating,
      phone:      "+63 912 000 0000",  // TODO: fetch from users table
      etaMinutes: 3,
      distanceKm: parseFloat(conv.distance) || 0.5,
    };
    useRideLifecycle.getState().onChatAgreed(matchedDriver, {
      id: conv.id,
      pickup: conv.pickup,
      dropoff: conv.dropoff,
      fare: amount,
      pickup_lat: null,
      pickup_lng: null,
      dropoff_lat: null,
      dropoff_lng: null,
      driver_name: conv.driverName,
      driver_initials: conv.driverInitials,
      driver_vehicle: conv.vehicle,
      driver_plate: conv.plate,
      driver_rating: conv.rating,
      notes: `Agreed in chat for ₱${amount.toFixed(2)}`,
    });
    // ─────────────────────────────────────────────────────────────────────────

    // ── TODO: INSERT INTO supabase rides table ────────────────────────────────
    // await supabase.from('rides').insert({
    //   rider_id:      currentUser.id,
    //   driver_id:     convId,
    //   conversation_id: convId,
    //   pickup:        conv.pickup,
    //   dropoff:       conv.dropoff,
    //   agreed_price:  amount,
    //   status:        'AGREED',
    //   created_at:    new Date().toISOString(),
    // });
    // Also update → supabase.from('conversations').update({ status: 'AGREED' }).eq('id', convId)
    // ─────────────────────────────────────────────────────────────────────────
  },

  closedConvAlert: null,
  clearClosedConvAlert: () => set({ closedConvAlert: null }),

  closeConversation: async (convId) => {
    const conv = get().conversations.find((c) => c.id === convId);
    const senderId = await ensureCurrentUserId();
    if (!conv) return;

    // Remove from state immediately so the closer doesn't see the DELETE realtime echo
    const remaining = get().conversations.filter((c) => c.id !== convId);
    set({ conversations: remaining, activeConvId: remaining[0]?.id ?? null });

    // Clear from localStorage
    const snapshot = readLocalChatSnapshot();
    writeLocalChatSnapshot(snapshot.conversations.filter((c) => c.id !== convId));

    if (!messagingBackendAvailable || convId.startsWith("local-")) return;

    const otherUserId = senderId === conv.riderId ? conv.driverId : conv.riderId;
    void createNotification(
      otherUserId,
      "Conversation closed",
      `${conv.driverName} closed the conversation and cleared the chat history.`,
      { conversationId: convId, action: "CLOSED" }
    );

    await supabase.from("messages").delete().eq("conversation_id", convId);
    await supabase.from("conversations").delete().eq("id", convId);
  },

  declineOffer: async (convId) => {
    const conv = get().conversations.find((c) => c.id === convId);
    const senderId = await ensureCurrentUserId();
    if (!conv) return;

    // No-op if there are no offers in the conversation
    if (!conv.messages.some((m) => m.offerType != null)) return;

    const systemMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: "system",
      text: "OFFER DECLINED — Continue negotiating or send a new offer.",
      time: now(),
    };

    try {
      await respondToOffer(conv.messages.findLast((message) => message.offerType != null)?.id ?? convId, "DECLINED");
      const { error } = await supabase.from("conversations").update({ status: "NEGOTIATING" }).eq("id", convId);
      if (error) {
        messagingBackendAvailable = false;
        const localSystemMsg: ChatMessage = {
          id: `local-decline-${Date.now()}`,
          sender: "system",
          text: systemMsg.text,
          time: now(),
        };
        const conversations = updateLocalConversation(convId, (item) => ({
          ...item,
          status: "NEGOTIATING",
          messages: [...item.messages, localSystemMsg],
          lastMessage: localSystemMsg.text ?? "",
          timeAgo: "now",
        }));
        set((state) => ({ ...state, conversations, activeConvId: convId }));
        return;
      }
      const { data: inserted, error: insertError } = await supabase
        .from("messages")
        .insert({
          conversation_id: convId,
          sender_id: senderId ?? conv.driverId,
          type: "system",
          content: systemMsg.text,
        })
        .select()
        .single();

      if (!insertError && inserted) {
        const mapped = mapMessageRowToChatMessage(inserted as MessageRow, {
          id: conv.id,
          rider_id: conv.riderId,
          driver_id: conv.driverId,
          status: conv.status,
          pickup: conv.pickup || null,
          dropoff: conv.dropoff || null,
          pickup_lat: null,
          pickup_lng: null,
          dropoff_lat: null,
          dropoff_lng: null,
          agreed_fare: conv.price.startsWith("₱") ? Number.parseFloat(conv.price.replace(/[^0-9.]/g, "")) : null,
          ride_id: null,
          last_message_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }, senderId ?? conv.driverId);

        set((state) => mergeConversationMessage(state, convId, mapped, "NEGOTIATING"));
      } else {
        set((state) => ({
          ...state,
          conversations: state.conversations.map((conversation) =>
            conversation.id === convId
              ? { ...conversation, status: "NEGOTIATING", lastMessage: systemMsg.text ?? "", timeAgo: "now" }
              : conversation
          ),
        }));
      }
    } catch (err) {
      console.warn("declineOffer supabase error:", err);
    }
  },
}));

// Initialize: load the signed-in user's conversations and subscribe to realtime messages.
(async function initChat() {
  if (chatInitializationStarted) return;
  chatInitializationStarted = true;

  try {
    const session = await getSession();
    currentUserId = session?.user?.id ?? null;

    if (!currentUserId) {
      useChat.setState({ conversations: [], activeConvId: null, isLoading: false });
      return;
    }

    if (await detectMissingChatSchema()) {
      const localSnapshot = readLocalChatSnapshot();
      useChat.setState({
        conversations: localSnapshot.conversations.map(cloneConversation),
        activeConvId: localSnapshot.conversations[0]?.id ?? null,
        isLoading: false,
      });
      return;
    }

    const conversationRows = await getConversations(currentUserId);
    let conversations: Conversation[] = [];
    let profileError: { message?: string } | null = null;

    if (conversationRows.length > 0) {
      const participantIds = Array.from(new Set(conversationRows.flatMap((row) => [row.driver_id, row.rider_id])));
      const { data: profiles, error } = await supabase
        .from("users")
        .select("id, full_name, vehicle, vehicle_type, driver_plate_number, rating")
        .in("id", participantIds);

      profileError = error;

      const userMap = new Map(
        (profiles ?? []).map((profile: any) => [profile.id, profile as { full_name?: string | null; vehicle?: string | null; vehicle_type?: string | null; driver_plate_number?: string | null; rating?: number | null }])
      );

      conversations = await Promise.all(
        conversationRows.map(async (row) => {
          const messageRows = await getMessages(row.id);
          const messages = messageRows.map((messageRow) => mapMessageRowToChatMessage(messageRow, row, currentUserId));
          return mapConversationRowToConversation(row, userMap, currentUserId, messages);
        })
      );
    }

    useChat.setState({
      conversations,
      activeConvId: conversations[0]?.id ?? null,
      isLoading: false,
    });

    if (realtimeMessagesChannel) {
      await supabase.removeChannel(realtimeMessagesChannel);
      realtimeMessagesChannel = null;
    }
    if (realtimeConversationsChannel) {
      await supabase.removeChannel(realtimeConversationsChannel);
      realtimeConversationsChannel = null;
    }

    // ── Realtime: new messages ────────────────────────────────────────────────
    realtimeMessagesChannel = supabase
      .channel(`chat-messages-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const messageRow = payload.new as MessageRow;
          if (messageRow.conversation_id == null) return;
          const { conversations } = useChat.getState();
          const conversation = conversations.find((item) => item.id === messageRow.conversation_id);
          if (!conversation) {
            // New conversation not yet in state — refresh to pull it in
            void useChat.getState().refreshConversations();
            return;
          }

          const mappedMessage = mapMessageRowToChatMessage(messageRow, {
            id: conversation.id,
            rider_id: conversation.riderId,
            driver_id: conversation.driverId,
            status: conversation.status,
            pickup: conversation.pickup || null,
            dropoff: conversation.dropoff || null,
            pickup_lat: null,
            pickup_lng: null,
            dropoff_lat: null,
            dropoff_lng: null,
            agreed_fare: conversation.price.startsWith("₱") ? Number.parseFloat(conversation.price.replace(/[^0-9.]/g, "")) : null,
            ride_id: null,
            last_message_at: messageRow.sent_at,
            created_at: messageRow.sent_at,
          }, currentUserId);

          useChat.setState((state) => mergeConversationMessage(state, conversation.id, mappedMessage));
        }
      )
      .subscribe();

    // ── Realtime: conversation status changes + new convs + close events ────────
    realtimeConversationsChannel = supabase
      .channel(`chat-conversations-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        async (payload) => {
          const row = payload.new as { id: string; rider_id: string; driver_id: string };
          // Only relevant if we're a participant
          if (row.rider_id !== currentUserId && row.driver_id !== currentUserId) return;
          // Pull full conversation (with profile + messages) into state
          await useChat.getState().refreshConversations();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          const row = payload.new as { id: string; status: string; pickup?: string | null; dropoff?: string | null; agreed_fare?: number | null };
          useChat.setState((state) => ({
            ...state,
            conversations: state.conversations.map((conv) => {
              if (conv.id !== row.id) return conv;
              return {
                ...conv,
                status: row.status as NegotiationStatus,
                pickup: row.pickup ?? conv.pickup,
                dropoff: row.dropoff ?? conv.dropoff,
                price: row.agreed_fare != null ? `₱${row.agreed_fare.toFixed(2)}` : conv.price,
              };
            }),
          }));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "conversations" },
        (payload) => {
          const deletedId = (payload.old as { id?: string }).id;
          if (!deletedId) return;
          const state = useChat.getState();
          const deletedConv = state.conversations.find((c) => c.id === deletedId);
          // Only act if this conversation is still in state (i.e. the OTHER party closed it)
          if (!deletedConv) return;
          const remaining = state.conversations.filter((c) => c.id !== deletedId);
          useChat.setState({
            conversations: remaining,
            activeConvId: state.activeConvId === deletedId ? (remaining[0]?.id ?? null) : state.activeConvId,
            closedConvAlert: deletedConv.driverName,
          });
        }
      )
      .subscribe();

    if (chatPollId) clearInterval(chatPollId);
    chatPollId = setInterval(() => {
      void useChat.getState().refreshConversations();
    }, 4000);

    if ((import.meta as any).hot) {
      (import.meta as any).hot.dispose(() => {
        if (realtimeMessagesChannel) {
          void supabase.removeChannel(realtimeMessagesChannel);
          realtimeMessagesChannel = null;
        }
        if (realtimeConversationsChannel) {
          void supabase.removeChannel(realtimeConversationsChannel);
          realtimeConversationsChannel = null;
        }
        if (chatPollId) {
          clearInterval(chatPollId);
          chatPollId = null;
        }
      });
    }

    if (profileError) {
      console.warn("initChat profile load warning:", profileError.message);
    }
  } catch (e) {
    console.warn("initChat error:", e);
    useChat.setState({ conversations: [], activeConvId: null, isLoading: false });
  }
})();
