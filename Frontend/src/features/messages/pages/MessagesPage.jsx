import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { Navigation } from "../../../shared/layout/Navigation";
import { CampusMap } from "../../../shared/components/map/CampusMap";
import { LocationSearchInput } from "../../../shared/components/LocationSearchInput";
import { useGeolocation } from "../../../shared/components/map/useGeolocation";
import { getSession } from "../../../shared/lib/supabase";
import { useChat } from "../hooks/useChat";

// ─── Status badge colors ───────────────────────────────────────────────────────
const STATUS_COLORS = {
  NEGOTIATING: "bg-[#f59e0b]",
  AGREED:      "bg-[#10b981]",
  COMPLETED:   "bg-[#6a7282]",
  CANCELLED:   "bg-[#ef4444]",
};

// ─── Conversation List Item ───────────────────────────────────────────────────
function ConversationItem({ conv, isActive, onClick, onClose }) {
  return (
    <div className={`relative border-b border-[#f3f4f6] group ${isActive ? "bg-black" : "bg-white"}`}>
    <button
      onClick={onClick}
      className={`w-full text-left h-[74px] relative hover:bg-gray-50 transition-colors ${isActive ? "bg-black hover:bg-gray-900" : "bg-white"}`}
    >
      <div className="absolute flex items-start justify-between left-3 top-3 right-3">
        <div className="flex items-center gap-2">
          <div className={`size-7 flex items-center justify-center shrink-0 ${isActive ? "bg-white" : "bg-black"}`}>
            <span className={`font-mono text-[9px] ${isActive ? "text-black" : "text-white"}`}>{conv.driverInitials}</span>
          </div>
          <div>
            <p className={`font-mono text-[10px] ${isActive ? "text-white" : "text-[#0a0a0a]"}`}>{conv.driverName}</p>
            <p className={`font-mono text-[8px] ${isActive ? "text-[#d1d5dc]" : "text-[#6a7282]"}`}>{conv.vehicle}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`${STATUS_COLORS[conv.status] ?? "bg-[#6a7282]"} px-1.5 py-0.5`}>
            <span className="font-mono text-[7px] text-white tracking-[0.5px]">{conv.status}</span>
          </div>
          <span className={`font-mono text-[8px] ${isActive ? "text-[#d1d5dc]" : "text-[#6a7282]"}`}>{conv.timeAgo}</span>
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 overflow-hidden" style={{ paddingLeft: "36px" }}>
        <p className={`font-mono text-[9px] truncate ${isActive ? "text-[#d1d5dc]" : "text-[#6a7282]"}`}>
          {conv.lastMessage}
        </p>
      </div>
    </button>
    <button
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      className="absolute top-1.5 right-1.5 size-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#9ca3af] hover:text-[#ef4444]"
      title="Close conversation"
    >
      <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
        <path d="M1 1L6 6M6 1L1 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
      </svg>
    </button>
    </div>
  );
}

// ─── Chat Message Bubble ──────────────────────────────────────────────────────
function ChatMessage({ msg, canApprove = false, onConfirm, onDecline }) {
  // System message (agreement/decline banners)
  if (msg.sender === "system") {
    return (
      <div className="flex justify-center mb-3">
        <div className="border border-dashed border-[#d1d5dc] px-3 py-2 max-w-[80%]">
          <p className="font-mono text-[9px] text-[#6a7282] text-center tracking-[0.3px]">{msg.text}</p>
        </div>
      </div>
    );
  }

  // Your offer card
  if (msg.offerType === "your") {
    return (
      <div className="flex justify-end mb-3">
        <div className={`border-2 border-black p-3 w-[180px] ${msg.offerStatus === "DECLINED" ? "opacity-50 grayscale" : ""}`}>
          <p className="font-mono text-[8px] text-[#6a7282] tracking-[0.8px] mb-1">YOUR OFFER</p>
          <p className="font-mono text-[20px] text-black">₱{msg.offerAmount.toFixed(2)}</p>
          {msg.offerDetails && (
            <div className="mt-2 border-t border-[#e5e7eb] pt-2">
              <p className="font-mono text-[7px] text-[#99a1af] uppercase tracking-[0.5px]">Pickup</p>
              <p className="font-mono text-[8px] text-black truncate">{msg.offerDetails.pickup}</p>
              <p className="font-mono text-[7px] text-[#99a1af] uppercase tracking-[0.5px] mt-1">Drop-off</p>
              <p className="font-mono text-[8px] text-black truncate">{msg.offerDetails.dropoff}</p>
              <p className="font-mono text-[7px] text-[#99a1af] uppercase tracking-[0.5px] mt-1">Passengers</p>
              <p className="font-mono text-[8px] text-black">{msg.offerDetails.passengers}</p>
            </div>
          )}
          {msg.offerStatus && msg.offerStatus !== "PENDING" && (
            <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px] mt-2">{msg.offerStatus}</p>
          )}
          <p className="font-mono text-[8px] text-[#6a7282] mt-1">{msg.time}</p>
        </div>
      </div>
    );
  }

  // Driver counter-offer card (offer received from other party)
  if (msg.offerType === "counter") {
    const settled = msg.offerStatus === "ACCEPTED" || msg.offerStatus === "DECLINED";
    return (
      <div className="flex justify-start mb-3">
        <div className={`border border-[#d1d5dc] p-3 w-[180px] ${msg.offerStatus === "DECLINED" ? "opacity-50 grayscale" : ""}`}>
          <p className="font-mono text-[8px] text-[#6a7282] tracking-[0.8px] mb-1">COUNTER OFFER</p>
          <p className="font-mono text-[20px] text-black">₱{msg.offerAmount.toFixed(2)}</p>
          {msg.offerDetails && (
            <div className="mt-2 border-t border-[#e5e7eb] pt-2">
              <p className="font-mono text-[7px] text-[#99a1af] uppercase tracking-[0.5px]">Pickup</p>
              <p className="font-mono text-[8px] text-black truncate">{msg.offerDetails.pickup}</p>
              <p className="font-mono text-[7px] text-[#99a1af] uppercase tracking-[0.5px] mt-1">Drop-off</p>
              <p className="font-mono text-[8px] text-black truncate">{msg.offerDetails.dropoff}</p>
              <p className="font-mono text-[7px] text-[#99a1af] uppercase tracking-[0.5px] mt-1">Passengers</p>
              <p className="font-mono text-[8px] text-black">{msg.offerDetails.passengers}</p>
            </div>
          )}
          {msg.offerStatus && msg.offerStatus !== "PENDING" && (
            <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px] mt-2">{msg.offerStatus}</p>
          )}
          {canApprove && !settled && (
            <div className="mt-2 flex gap-1.5">
              <button
                onClick={() => onConfirm(msg)}
                className="flex-1 h-7 bg-[#10b981] font-mono text-[8px] text-white tracking-[0.5px] hover:bg-green-600"
              >
                CONFIRM
              </button>
              <button
                onClick={() => onDecline(msg)}
                className="flex-1 h-7 bg-[#ef4444] font-mono text-[8px] text-white tracking-[0.5px] hover:bg-red-600"
              >
                DECLINE
              </button>
            </div>
          )}
          <p className="font-mono text-[8px] text-[#6a7282] mt-1">{msg.time}</p>
        </div>
      </div>
    );
  }

  // Standard text bubble
  const isSelf = msg.sender === "self";
  return (
    <div className={`flex mb-3 ${isSelf ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[70%]">
        {!isSelf && <p className="font-mono text-[8px] text-[#6a7282] mb-1 tracking-[0.5px]">DRIVER</p>}
        <div className={`px-3 py-2 ${isSelf ? "bg-black" : "border border-[#d1d5dc] bg-white"}`}>
          <p className={`font-mono text-[10px] leading-relaxed ${isSelf ? "text-white" : "text-black"}`}>{msg.text}</p>
        </div>
        <p className={`font-mono text-[8px] text-[#6a7282] mt-0.5 ${isSelf ? "text-right" : ""}`}>{msg.time}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function MessagesPage() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState("RIDER");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerPickup,  setOfferPickup]  = useState({ label: "CIT-U Main Gate", coords: { lat: 10.2941, lng: 123.8818 } });
  const [offerDropoff, setOfferDropoff] = useState({ label: "", coords: null });
  const [offerPassengers, setOfferPassengers] = useState(1);
  const [selfUserId, setSelfUserId] = useState(null);
  const [closeConfirmConvId, setCloseConfirmConvId] = useState(null);
  const messagesEndRef = useRef(null);

  const {
    conversations,
    activeConvId,
    isLoading,
    searchResults,
    setActiveConv,
    searchContacts,
    sendRequest,
    acceptRequest,
    declineRequest,
    sendMessage,
    sendOffer,
    confirmOffer,
    declineOffer,
    closeConversation,
    closedConvAlert,
    clearClosedConvAlert,
    refreshConversations,
  } = useChat();

  // Show toast when the other party closes the conversation
  useEffect(() => {
    if (!closedConvAlert) return;
    toast.info(`Conversation with ${closedConvAlert} was closed.`, { duration: 6000 });
    clearClosedConvAlert();
  }, [closedConvAlert, clearClosedConvAlert]);

  // Deep-link: auto-select the conversation for the driverId from the URL
  useEffect(() => {
    if (driverId) {
      const exists = conversations.find((c) => c.id === driverId || c.driverId === driverId);
      if (exists) {
        setActiveConv(exists.id);
      }
    } else if (!activeConvId && conversations.length > 0) {
      // Fallback: select first conversation when no param
      setActiveConv(conversations[0].id);
    }
  }, [driverId, conversations, activeConvId, setActiveConv]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchContacts(searchQuery, mode);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [mode, searchContacts, searchQuery]);

  // Sync URL param with store when user clicks a conversation in the sidebar
  const handleSelectConv = (id) => {
    setActiveConv(id);
    navigate(`/messages/${id}`, { replace: true });
  };

  const handleSelectSearchResult = async (result) => {
    await sendRequest(result, mode);
    setSearchQuery("");
    refreshConversations();
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConvId, conversations]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await getSession();
      if (!cancelled) {
        setSelfUserId(session?.user?.id ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { effectiveCoords } = useGeolocation();
  const activeConv = conversations.find((c) => c.id === activeConvId);
  const isCooldownActive = Boolean(activeConv?.cooldownUntil && activeConv.cooldownUntil > Date.now());
  const requestMessageCount = activeConv?.status === "REQUESTED"
    ? activeConv.messages.filter((message) => message.sender === (mode === "RIDER" ? "self" : "driver") && message.text).length
    : 0;
  const isRequestLocked = activeConv?.status === "REQUESTED" && requestMessageCount >= 3;
  const requestFooterLabel = activeConv?.status === "REQUESTED"
    ? `${requestMessageCount}/3 request messages`
    : activeConv?.status === "CANCELLED" && isCooldownActive
      ? `Cooldown active until ${new Date(activeConv.cooldownUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : null;

  const isConversationParticipant = Boolean(
    activeConv && selfUserId && (selfUserId === activeConv.riderId || selfUserId === activeConv.driverId)
  );
  const isCurrentUserRequestSender = Boolean(
    activeConv && selfUserId && (
      (mode === "RIDER" && selfUserId === activeConv.riderId) ||
      (mode === "DRIVER" && selfUserId === activeConv.driverId)
    )
  );
  const isCurrentUserDriver = Boolean(activeConv && selfUserId && selfUserId === activeConv.driverId);
  const latestPendingIncomingOffer = activeConv?.messages
    .filter((m) => m.offerType === "counter" && (m.offerStatus === "PENDING" || m.offerStatus == null))
    .at(-1);
  const canRespondToRequest = Boolean(
    activeConv?.status === "REQUESTED" && isConversationParticipant && !isCurrentUserRequestSender
  );

  // Find the most recent counter-offer amount for CONFIRM to reference
  const latestCounterOffer = activeConv?.messages
    .filter((m) => m.offerType === "counter")
    .at(-1);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConvId) return;
    await sendMessage(activeConvId, messageInput.trim());
    setMessageInput("");
  };

  const handleSubmitOffer = async () => {
    const amount = Number.parseFloat(offerAmount);
    if (!activeConvId || !Number.isFinite(amount) || !offerDropoff.coords) return;
    await sendOffer(activeConvId, amount, {
      pickup: offerPickup.label,
      dropoff: offerDropoff.label,
      passengers: offerPassengers,
    });
    setOfferModalOpen(false);
    setOfferAmount("");
  };

  const handleAcceptRequest = async () => {
    if (!activeConvId || !canRespondToRequest) return;
    await acceptRequest(activeConvId);
  };

  const handleDeclineRequest = async () => {
    if (!activeConvId || !canRespondToRequest) return;
    await declineRequest(activeConvId);
  };
  const fallbackConversation = {
    id: "",
    driverId: "",
    riderId: "",
    driverInitials: "--",
    driverName: isLoading ? "Loading conversations" : "No conversation selected",
    vehicle: "",
    plate: "",
    rating: 0,
    status: "CANCELLED",
    lastMessage: "",
    timeAgo: "",
    pickup: "Search to start a request thread",
    dropoff: "Select a registered user",
    price: "",
    distance: "",
    messages: [],
  };
  const activeThread = activeConv ?? fallbackConversation;

  return (
    <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
      <Navigation
        activePage="messages"
        mode={mode}
        onModeToggle={(targetMode) => setMode(targetMode)}
      />

      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: Conversation List ──────────────────────────────────── */}
        <aside className="w-[270px] shrink-0 border-r border-[#e5e7eb] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#e5e7eb]">
            <p className="font-mono text-[8px] text-[#99a1af] tracking-[2px]">MESSAGES</p>
            <p className="font-mono text-[11px] text-black tracking-[0.5px] mt-0.5">
              {conversations.length} CONVERSATIONS
            </p>
          </div>
          <div className="p-3 border-b border-[#e5e7eb] space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px] whitespace-nowrap">SEARCH</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search registered users..."
                className="flex-1 border border-[#e5e7eb] px-2 py-1 font-mono text-[9px] text-black outline-none placeholder:text-[#d1d5dc]"
              />
            </div>
            {searchQuery.trim() && (
              <div className="max-h-[160px] overflow-y-auto space-y-1">
                {searchResults.length === 0 ? (
                  <p className="font-mono text-[8px] text-[#99a1af]">No registered users match your search.</p>
                ) : (
                  searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full border border-[#e5e7eb] bg-white p-2 text-left hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-mono text-[9px] text-black">{result.full_name}</p>
                          <p className="font-mono text-[7px] text-[#6a7282]">
                            {result.role ?? "USER"} {result.vehicle ? `· ${result.vehicle}` : ""}
                          </p>
                        </div>
                        <span className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px]">REQUEST</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4">
                <p className="font-mono text-[9px] text-[#99a1af] tracking-[1.5px]">NO ACTIVE CONVERSATIONS</p>
                <p className="font-mono text-[8px] text-[#6a7282] mt-2 leading-relaxed">
                  Chats will appear here once a rider opens a conversation with a driver.
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeConvId}
                  onClick={() => handleSelectConv(conv.id)}
                  onClose={() => setCloseConfirmConvId(conv.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Center: Chat Window ──────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden border-r border-[#e5e7eb]">

          {/* Chat Header */}
          <div className="h-[52px] shrink-0 border-b border-[#e5e7eb] flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="bg-black size-9 flex items-center justify-center">
                <span className="font-mono text-[11px] text-white">{activeThread.driverInitials}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-black">{activeThread.driverName}</span>
                  <div className={`${STATUS_COLORS[activeThread.status] ?? "bg-[#6a7282]"} px-1.5 py-0.5`}>
                    <span className="font-mono text-[7px] text-white tracking-[0.5px]">{activeThread.status}</span>
                  </div>
                </div>
                <p className="font-mono text-[8px] text-[#6a7282]">
                  {activeThread.vehicle || "No ride details yet"}
                  {activeThread.plate ? ` · ${activeThread.plate}` : ""}
                  {activeThread.rating ? ` · ★ ${activeThread.rating}` : ""}
                </p>
              </div>
            </div>
            <button className="bg-[#ef4444] h-7 px-3 flex items-center gap-1 hover:bg-red-600 transition-colors">
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M8.25 6.75L5.25 1.5C5.11 1.24 4.84 1.07 4.54 1.07C4.24 1.07 3.97 1.24 3.83 1.5L0.83 6.75C0.69 7.01 0.69 7.31 0.83 7.57C0.97 7.83 1.24 8 1.54 8H7.54C7.84 8 8.11 7.83 8.25 7.57C8.39 7.31 8.39 7.01 8.25 6.75Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" />
                <path d="M4.54 3.38V4.88" stroke="white" strokeLinecap="round" strokeWidth="0.75" />
                <path d="M4.54 6.38H4.54" stroke="white" strokeLinecap="round" strokeWidth="1.1" />
              </svg>
              <span className="font-mono text-[8px] text-white tracking-[0.5px]">SOS</span>
            </button>
          </div>

          {/* Route Bar */}
          <div className="border-b border-[#f3f4f6] px-4 py-2 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full border-2 border-[#2563eb]" />
              <span className="font-mono text-[9px] text-[#6a7282]">{activeThread.pickup}</span>
            </div>
            <div className="flex-1 h-px bg-[#d1d5dc] max-w-[40px]" />
            <div className="flex items-center gap-1.5">
              <div className="size-2 bg-[#ef4444]" />
              <span className="font-mono text-[9px] text-[#6a7282]">{activeThread.dropoff}</span>
            </div>
          </div>

          {activeThread.id && activeThread.status === "REQUESTED" && (
            <div className="border-b border-[#e5e7eb] px-4 py-2 flex items-center justify-between gap-3 bg-[#fafafa]">
              <div>
                <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px]">MESSAGE REQUEST</p>
                <p className="font-mono text-[9px] text-black mt-1">
                  {canRespondToRequest
                    ? "You received a message request. Accept or decline to continue."
                    : (requestFooterLabel ?? "Waiting for the receiver to accept or decline this request.")}
                </p>
              </div>
              {canRespondToRequest && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAcceptRequest}
                    className="h-8 px-3 bg-[#10b981] font-mono text-[8px] text-white tracking-[0.5px]"
                  >
                    ACCEPT
                  </button>
                  <button
                    onClick={handleDeclineRequest}
                    className="h-8 px-3 bg-[#ef4444] font-mono text-[8px] text-white tracking-[0.5px]"
                  >
                    DECLINE
                  </button>
                </div>
              )}
            </div>
          )}

          {activeThread.id && activeThread.status === "CANCELLED" && isCooldownActive && (
            <div className="border-b border-[#e5e7eb] px-4 py-2 bg-[#fff7ed]">
              <p className="font-mono text-[8px] text-[#b45309] tracking-[1.5px]">COOLDOWN ACTIVE</p>
              <p className="font-mono text-[9px] text-black mt-1">
                This contact is temporarily unavailable after a declined request.
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeThread.messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                canApprove={
                  isCurrentUserDriver &&
                  activeThread.status === "NEGOTIATING" &&
                  msg.id === latestPendingIncomingOffer?.id
                }
                onConfirm={(m) => confirmOffer(activeConvId, m.offerAmount)}
                onDecline={() => declineOffer(activeConvId)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Offer / Negotiation Bar — only shown when NEGOTIATING */}
          {activeThread.id && activeThread.status === "NEGOTIATING" && (
            <div className="border-t border-[#e5e7eb] flex items-center h-[42px]">
              <button
                onClick={() => setOfferModalOpen(true)}
                className="flex-1 h-full flex items-center justify-center gap-2 font-mono text-[9px] tracking-[0.5px] hover:bg-gray-50 transition-colors"
              >
                <span>OPEN OFFER POPUP</span>
              </button>
            </div>
          )}

          {/* Message Input — always visible */}
          <div className="border-t border-[#e5e7eb] flex items-center h-[46px]">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={isRequestLocked ? "Request limit reached" : activeThread.status === "REQUESTED" ? "Send request message..." : "Type a message..."}
              disabled={Boolean(isCooldownActive) || !activeConvId}
              className="flex-1 h-full px-4 font-mono text-[10px] text-black bg-transparent outline-none placeholder:text-[#d1d5dc]"
            />
            <button
              onClick={handleSendMessage}
              disabled={Boolean(isCooldownActive) || !activeConvId}
              className="size-[46px] bg-black flex items-center justify-center hover:bg-gray-900 transition-colors shrink-0 disabled:opacity-50"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M12.75 0.625L1.5 5.375L5.25 7.25L7.125 11L12.75 0.625Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9" />
                <path d="M5.25 7.25L7.625 4.875" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9" />
              </svg>
            </button>
          </div>
        </main>

        {/* ── Right Panel: Ride Details ────────────────────────────────── */}
        <aside className="w-[200px] shrink-0 flex flex-col overflow-hidden">

          {/* Ride Details */}
          <div className="p-3 border-b border-[#e5e7eb]">
            <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-2">RIDE DETAILS</p>
            {activeConv ? (
              [
                { label: "STATUS",   value: activeConv.status,   isStatus: true },
                { label: "PICKUP",   value: activeConv.pickup },
                { label: "DROP-OFF", value: activeConv.dropoff },
                { label: "PRICE",    value: activeConv.price || "—" },
                { label: "DISTANCE", value: activeConv.distance || "—" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[8px] text-[#99a1af] tracking-[0.5px]">{item.label}</span>
                  {item.isStatus ? (
                    <div className={`${STATUS_COLORS[item.value] ?? "bg-[#6a7282]"} px-1.5`}>
                      <span className="font-mono text-[7px] text-white">{item.value}</span>
                    </div>
                  ) : (
                    <span className="font-mono text-[8px] text-black text-right max-w-[100px] truncate">{item.value}</span>
                  )}
                </div>
              ))
            ) : (
              <p className="font-mono text-[8px] text-[#6a7282] leading-relaxed">
                Select a user or open a request thread to see ride details.
              </p>
            )}
          </div>

          {/* Driver Profile */}
          <div className="p-3 border-b border-[#e5e7eb]">
            <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-2">DRIVER PROFILE</p>
            {activeConv ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-black size-9 flex items-center justify-center shrink-0">
                    <span className="font-mono text-[11px] text-white">{activeConv.driverInitials}</span>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] text-black">{activeConv.driverName}</p>
                    <p className="font-mono text-[7px] text-[#99a1af]">
                      {activeConv.driverName.toLowerCase().replace(" ", ".")}@uni.edu
                    </p>
                  </div>
                </div>
                <div className="flex justify-around">
                  <div className="text-center">
                    <p className="font-mono text-[14px] text-black">{activeConv.rating}</p>
                    <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.3px]">RATING</p>
                  </div>
                  <div className="w-px bg-[#e5e7eb]" />
                  <div className="text-center">
                    <p className="font-mono text-[14px] text-black">94</p>
                    <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.3px]">RIDES</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="font-mono text-[8px] text-[#6a7282] leading-relaxed">
                No user selected.
              </p>
            )}
          </div>

          {/* Safety */}
          <div className="p-3">
            <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-2">SAFETY</p>
            <button className="w-full bg-[#ef4444] h-[34px] flex items-center justify-center gap-2 hover:bg-red-600 transition-colors">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M9.96 8.25L6.29 1.83C6.05 1.41 5.8 1.37 5.5 1.37C5.2 1.37 4.95 1.41 4.7 1.83L1.03 8.25C0.7 8.82 1.12 9.63 1.83 9.63H9.17C9.88 9.63 10.3 8.82 9.96 8.25Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9" />
                <path d="M5.5 4.13V5.96" stroke="white" strokeLinecap="round" strokeWidth="0.9" />
                <path d="M5.5 7.79H5.5" stroke="white" strokeLinecap="round" strokeWidth="1.2" />
              </svg>
              <span className="font-mono text-[9px] text-white tracking-[0.5px]">TRIGGER SOS</span>
            </button>
            <p className="font-mono text-[7px] text-[#99a1af] text-center mt-1.5 leading-[1.4]">
              Hold 3s to alert campus security + emergency contact
            </p>
          </div>
        </aside>
      </div>

      {offerModalOpen && activeConv && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center px-4">
          <div className="w-full max-w-4xl bg-white border border-[#e5e7eb] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
              <div>
                <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px]">MAKE AN OFFER</p>
                <p className="font-mono text-[11px] text-black mt-1">Pickup, destination, passengers, and price before sending</p>
              </div>
              <button onClick={() => setOfferModalOpen(false)} className="font-mono text-[10px] text-[#6a7282]">CLOSE</button>
            </div>
            <div className="grid grid-cols-[1.1fr_0.9fr] min-h-[420px]">
              <div className="border-r border-[#e5e7eb]">
                <CampusMap
                  compact
                  showCurrentLocation={false}
                  pickup={offerPickup.coords ? { ...offerPickup.coords, label: offerPickup.label } : null}
                  destination={offerDropoff.coords ? { ...offerDropoff.coords, label: offerDropoff.label } : null}
                />
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-2">AMOUNT</label>
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={(event) => setOfferAmount(event.target.value)}
                    placeholder="0.00"
                    className="w-full border border-[#e5e7eb] px-3 py-2 font-mono text-[12px] text-black outline-none"
                  />
                </div>

                <LocationSearchInput
                  label="PICKUP"
                  placeholder="Search pickup..."
                  value={offerPickup.label}
                  biasCoords={effectiveCoords}
                  onSelect={(label, coords) => setOfferPickup({ label, coords })}
                  onChange={(label) => setOfferPickup((p) => ({ ...p, label }))}
                />

                <LocationSearchInput
                  label="DESTINATION"
                  placeholder="Search destination..."
                  value={offerDropoff.label}
                  biasCoords={effectiveCoords}
                  onSelect={(label, coords) => setOfferDropoff({ label, coords })}
                  onChange={(label) => setOfferDropoff((p) => ({ ...p, label }))}
                />

                <div>
                  <label className="block font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-2">PASSENGERS</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((count) => (
                      <button
                        key={count}
                        onClick={() => setOfferPassengers(count)}
                        className={`size-9 border font-mono text-[10px] ${offerPassengers === count ? "bg-black text-white border-black" : "bg-white text-black border-[#e5e7eb]"}`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <p className="font-mono text-[8px] text-[#99a1af]">Offers stay in chat and do not touch the orders dashboard.</p>
                  <button onClick={handleSubmitOffer} className="h-10 px-4 bg-black font-mono text-[9px] text-white tracking-[0.5px]">
                    SEND OFFER
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {closeConfirmConvId && (() => {
        const target = conversations.find((c) => c.id === closeConfirmConvId);
        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
            <div className="bg-white border border-[#e5e7eb] w-full max-w-sm shadow-2xl">
              <div className="px-5 py-4 border-b border-[#e5e7eb]">
                <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px]">CLOSE CONVERSATION</p>
                <p className="font-mono text-[12px] text-black mt-1">
                  Close chat with {target?.driverName ?? "this user"}?
                </p>
              </div>
              <div className="px-5 py-4 space-y-2">
                <p className="font-mono text-[9px] text-[#6a7282] leading-relaxed">
                  This will permanently delete all messages for both parties. The other person will be notified. Neither party can undo this.
                </p>
                <p className="font-mono text-[9px] text-[#6a7282] leading-relaxed">
                  You can start a new conversation by searching again.
                </p>
              </div>
              <div className="px-5 pb-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setCloseConfirmConvId(null)}
                  className="h-9 px-4 border border-[#e5e7eb] font-mono text-[9px] text-[#6a7282] tracking-[0.5px] hover:bg-gray-50"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    closeConversation(closeConfirmConvId);
                    setCloseConfirmConvId(null);
                  }}
                  className="h-9 px-4 bg-[#ef4444] font-mono text-[9px] text-white tracking-[0.5px] hover:bg-red-600"
                >
                  CLOSE & DELETE
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
