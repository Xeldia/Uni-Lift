import { useState } from "react";
import { Navigation } from "../components/Navigation";
import { CampusMap } from "../components/CampusMap";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CONVERSATIONS = [
  {
    id: "1",
    driverInitials: "MR",
    driverName: "Marcus Rivera",
    vehicle: "Honda Click 150i",
    plate: "YZA 4521",
    rating: 4.8,
    status: "NEGOTIATING",
    lastMessage: "Sure, ₱30 works. See you at the gate!",
    timeAgo: "2 min ago",
    pickup: "Engineering Gate",
    dropoff: "Main Campus Plaza",
    price: "NEGOTIATING",
    distance: "0.3 km",
    messages: [
      { id: "m1", sender: "self",   text: "Hi! Heading to Main Campus Plaza from the Engineering gate. Available?", time: "10:32" },
      { id: "m2", sender: "driver", text: "Yes, I'm nearby! Give me 3 minutes. What's your offer?", time: "10:33" },
      { id: "m3", sender: "self",   offerAmount: 25.00, offerType: "your",     time: "10:34" },
      { id: "m4", sender: "driver", offerAmount: 30.00, offerType: "counter",  time: "10:34" },
      { id: "m5", sender: "self",   text: "Sure, ₱30 works. See you at the gate!", time: "10:35" },
    ],
  },
  {
    id: "2",
    driverInitials: "KS",
    driverName: "Kyla Santos",
    vehicle: "Toyota Wigo",
    plate: "ABC 1234",
    rating: 4.5,
    status: "AGREED",
    lastMessage: "RIDE AGREEMENT CONFIRMED — ₱50.00 | Library Steps ...",
    timeAgo: "15 min ago",
    pickup: "Library Steps",
    dropoff: "Dorm Block A",
    price: "₱50.00",
    distance: "0.7 km",
    messages: [
      { id: "m1", sender: "self",   text: "Hey! Going to Dorm Block A, can you take me?", time: "10:10" },
      { id: "m2", sender: "driver", text: "Sure! Meet me at the Library steps. ₱50 fixed.", time: "10:11" },
      { id: "m3", sender: "self",   text: "Deal! I'll be there in 2 mins.", time: "10:12" },
    ],
  },
  {
    id: "3",
    driverInitials: "DR",
    driverName: "Diego Reyes",
    vehicle: "Yamaha NMAX 155",
    plate: "XYZ 8999",
    rating: 4.0,
    status: "COMPLETED",
    lastMessage: "RIDE COMPLETED — Science Block — SM City",
    timeAgo: "3 hrs ago",
    pickup: "Science Block",
    dropoff: "SM City",
    price: "FREE",
    distance: "2.4 km",
    messages: [
      { id: "m1", sender: "self",   text: "Thanks for the ride!", time: "07:44" },
      { id: "m2", sender: "driver", text: "No problem! Stay safe.", time: "07:45" },
    ],
  },
];

const STATUS_COLORS = {
  NEGOTIATING: "bg-[#f59e0b]",
  AGREED:      "bg-[#10b981]",
  COMPLETED:   "bg-[#6a7282]",
};

// ─── Conversation Item ────────────────────────────────────────────────────────
function ConversationItem({ conv, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left h-[74px] relative border-b border-[#f3f4f6] hover:bg-gray-50 transition-colors ${isActive ? "bg-black" : "bg-white"}`}
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
          <div className={`${STATUS_COLORS[conv.status]} px-1.5 py-0.5`}>
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
  );
}

// ─── Chat Message ─────────────────────────────────────────────────────────────
function ChatMessage({ msg }) {
  if (msg.offerType === "your") {
    return (
      <div className="flex justify-end mb-3">
        <div className="border-2 border-black p-3 w-[140px]">
          <p className="font-mono text-[8px] text-[#6a7282] tracking-[0.8px] mb-1">YOUR OFFER</p>
          <p className="font-mono text-[20px] text-black">₱{msg.offerAmount.toFixed(2)}</p>
          <p className="font-mono text-[8px] text-[#6a7282] mt-1">{msg.time}</p>
        </div>
      </div>
    );
  }

  if (msg.offerType === "counter") {
    return (
      <div className="flex justify-start mb-3">
        <div className="border border-[#d1d5dc] p-3 w-[140px]">
          <p className="font-mono text-[8px] text-[#6a7282] tracking-[0.8px] mb-1">COUNTER OFFER</p>
          <p className="font-mono text-[20px] text-black">₱{msg.offerAmount.toFixed(2)}</p>
          <p className="font-mono text-[8px] text-[#6a7282] mt-1">{msg.time}</p>
        </div>
      </div>
    );
  }

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
  const [mode, setMode] = useState("RIDER");
  const [activeConvId, setActiveConvId] = useState("1");
  const [messageInput, setMessageInput] = useState("");
  const [offerInput, setOfferInput] = useState("");
  const [extraMessages, setExtraMessages] = useState({});

  const activeConv = CONVERSATIONS.find((c) => c.id === activeConvId);
  const activeMessages = [...(activeConv?.messages || []), ...(extraMessages[activeConvId] || [])];

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: "self",
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
    setExtraMessages((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMsg],
    }));
    setMessageInput("");
  };

  const sendOffer = () => {
    const amount = parseFloat(offerInput);
    if (!offerInput.trim() || isNaN(amount)) return;
    const newMsg = {
      id: `offer-${Date.now()}`,
      sender: "self",
      offerAmount: amount,
      offerType: "your",
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
    setExtraMessages((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMsg],
    }));
    setOfferInput("");
  };

  return (
    <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
      <Navigation
        activePage="messages"
        mode={mode}
        onModeToggle={() => setMode(mode === "RIDER" ? "DRIVER" : "RIDER")}
      />

      <div className="flex-1 flex overflow-hidden">

        {/* Left: Conversation List */}
        <aside className="w-[270px] shrink-0 border-r border-[#e5e7eb] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#e5e7eb]">
            <p className="font-mono text-[8px] text-[#99a1af] tracking-[2px]">MESSAGES</p>
            <p className="font-mono text-[11px] text-black tracking-[0.5px] mt-0.5">
              {CONVERSATIONS.length} CONVERSATIONS
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {CONVERSATIONS.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConvId}
                onClick={() => setActiveConvId(conv.id)}
              />
            ))}
          </div>
        </aside>

        {/* Center: Chat Window */}
        <main className="flex-1 flex flex-col overflow-hidden border-r border-[#e5e7eb]">

          {/* Chat Header */}
          <div className="h-[52px] shrink-0 border-b border-[#e5e7eb] flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="bg-black size-9 flex items-center justify-center">
                <span className="font-mono text-[11px] text-white">{activeConv.driverInitials}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-black">{activeConv.driverName}</span>
                  <div className={`${STATUS_COLORS[activeConv.status]} px-1.5 py-0.5`}>
                    <span className="font-mono text-[7px] text-white tracking-[0.5px]">{activeConv.status}</span>
                  </div>
                </div>
                <p className="font-mono text-[8px] text-[#6a7282]">
                  {activeConv.vehicle} · {activeConv.plate} · ★ {activeConv.rating}
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

          {/* Route Display */}
          <div className="border-b border-[#f3f4f6] px-4 py-2 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full border-2 border-[#2563eb]" />
              <span className="font-mono text-[9px] text-[#6a7282]">{activeConv.pickup}</span>
            </div>
            <div className="flex-1 h-px bg-[#d1d5dc] max-w-[40px]" />
            <div className="flex items-center gap-1.5">
              <div className="size-2 bg-[#ef4444]" />
              <span className="font-mono text-[9px] text-[#6a7282]">{activeConv.dropoff}</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeMessages.map((msg) => (
              <ChatMessage key={msg.id} msg={msg} />
            ))}
          </div>

          {/* Offer Bar (shown when NEGOTIATING) */}
          {activeConv.status === "NEGOTIATING" && (
            <div className="border-t border-[#e5e7eb] flex items-center h-[42px]">
              <div className="flex-1 h-full flex items-center px-3 gap-1">
                <span className="font-mono text-[9px] text-[#99a1af]">₱</span>
                <input
                  type="number"
                  value={offerInput}
                  onChange={(e) => setOfferInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendOffer()}
                  placeholder="Make an offer..."
                  className="flex-1 font-mono text-[10px] text-black bg-transparent outline-none placeholder:text-[#d1d5dc]"
                />
              </div>
              <button onClick={sendOffer} className="h-full px-4 border-l border-[#e5e7eb] font-mono text-[9px] text-black tracking-[0.5px] hover:bg-gray-50 transition-colors">
                OFFER
              </button>
              <button className="h-full px-3 bg-[#10b981] font-mono text-[9px] text-white tracking-[0.5px] flex items-center gap-1 hover:bg-green-600 transition-colors">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                </svg>
                CONFIRM
              </button>
              <button className="h-full px-3 bg-[#ef4444] font-mono text-[9px] text-white tracking-[0.5px] flex items-center gap-1 hover:bg-red-600 transition-colors">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M2 2L7 7M7 2L2 7" stroke="white" strokeLinecap="round" strokeWidth="1" />
                </svg>
                DECLINE
              </button>
            </div>
          )}

          {/* Message Input */}
          <div className="border-t border-[#e5e7eb] flex items-center h-[46px]">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 h-full px-4 font-mono text-[10px] text-black bg-transparent outline-none placeholder:text-[#d1d5dc]"
            />
            <button
              onClick={sendMessage}
              className="size-[46px] bg-black flex items-center justify-center hover:bg-gray-900 transition-colors shrink-0"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M12.75 0.625L1.5 5.375L5.25 7.25L7.125 11L12.75 0.625Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9" />
                <path d="M5.25 7.25L7.625 4.875" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9" />
              </svg>
            </button>
          </div>
        </main>

        {/* Right Panel: Details */}
        <aside className="w-[200px] shrink-0 flex flex-col overflow-hidden">

          {/* Mini Map */}
          <div className="h-[160px] shrink-0 border-b border-[#e5e7eb]">
            <CampusMap compact showCurrentLocation />
          </div>

          {/* Ride Details */}
          <div className="p-3 border-b border-[#e5e7eb]">
            <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-2">RIDE DETAILS</p>
            {[
              { label: "STATUS",   value: activeConv.status, isStatus: true },
              { label: "PICKUP",   value: activeConv.pickup },
              { label: "DROP-OFF", value: activeConv.dropoff },
              { label: "PRICE",    value: activeConv.price },
              { label: "DISTANCE", value: activeConv.distance },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[8px] text-[#99a1af] tracking-[0.5px]">{item.label}</span>
                {item.isStatus ? (
                  <div className={`${STATUS_COLORS[item.value]} px-1.5`}>
                    <span className="font-mono text-[7px] text-white">{item.value}</span>
                  </div>
                ) : (
                  <span className="font-mono text-[8px] text-black text-right max-w-[100px] truncate">{item.value}</span>
                )}
              </div>
            ))}
          </div>

          {/* Driver Profile */}
          <div className="p-3 border-b border-[#e5e7eb]">
            <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-2">DRIVER PROFILE</p>
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
    </div>
  );
}
