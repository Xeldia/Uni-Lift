import { useState } from "react";
import { AdminNavigation } from "../components/AdminNavigation";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_SOS_ALERTS = [
  { id: "SOS001", type: "ALARM", userId: "U004", userName: "Anne Cruz", rideId: "R001", driverName: "Marcus Rivera", location: "CIT Main Gate", lat: 10.3157, lng: 123.8854, status: "ACTIVE", triggeredAt: "2026-03-07 14:35", contactPhone: "+63 912 345 6789" },
  { id: "SOS002", type: "SILENT", userId: "U005", userName: "John Smith", rideId: "R005", driverName: "Marcus Rivera", location: "Near CIT Dormitory", lat: 10.3162, lng: 123.8849, status: "ACTIVE", triggeredAt: "2026-03-07 14:50", contactPhone: "+63 917 234 5678" },
  { id: "SOS003", type: "ALARM", userId: "U008", userName: "Emma Wilson", rideId: "R008", driverName: "Diego Reyes", location: "CIT Library Parking", lat: 10.3155, lng: 123.8860, status: "RESOLVED", triggeredAt: "2026-03-07 09:10", resolvedAt: "2026-03-07 09:18", resolvedBy: "Admin", resolutionNote: "False alarm - accidental trigger", contactPhone: "+63 918 765 4321" },
  { id: "SOS004", type: "SILENT", userId: "U006", userName: "Sarah Chen", rideId: "R004", driverName: "Leo Martinez", location: "CIT Engineering Exit", lat: 10.3150, lng: 123.8845, status: "RESOLVED", triggeredAt: "2026-03-07 11:58", resolvedAt: "2026-03-07 12:05", resolvedBy: "Security", resolutionNote: "Security dispatched and cleared", contactPhone: "+63 919 876 5432" },
];

// ─── Alert Type Badge ─────────────────────────────────────────────────────────
function AlertTypeBadge({ type }) {
  const isAlarm = type === "ALARM";
  return (
    <div className={`${isAlarm ? "bg-[#ef4444]" : "bg-[#f59e0b]"} px-2 py-0.5 inline-flex items-center gap-1`}>
      {isAlarm ? (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M4 1V4L5.5 5.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="4" cy="4" r="3" stroke="white" />
        </svg>
      ) : (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M4 1V4.5M4 6V6.5" stroke="white" strokeLinecap="round" />
          <circle cx="4" cy="4" r="3" stroke="white" />
        </svg>
      )}
      <span className="font-mono text-[7px] text-white tracking-[0.5px]">{type}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const isActive = status === "ACTIVE";
  return (
    <div className={`${isActive ? "bg-[#ef4444] animate-pulse" : "bg-[#10b981]"} px-2 py-0.5 inline-flex`}>
      <span className="font-mono text-[7px] text-white tracking-[0.5px]">{status}</span>
    </div>
  );
}

// ─── SOS Alert Card ───────────────────────────────────────────────────────────
function SOSAlertCard({ alert, isSelected, onSelect }) {
  const isActive = alert.status === "ACTIVE";
  
  return (
    <div
      onClick={onSelect}
      className={`p-4 border cursor-pointer transition-all ${
        isSelected 
          ? "border-[#ef4444] bg-[#fef2f2]" 
          : isActive 
            ? "border-[#ef4444] bg-[#fef2f2] hover:bg-[#fee2e2]" 
            : "border-[#e5e7eb] hover:bg-gray-50"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTypeBadge type={alert.type} />
          <span className="font-mono text-[9px] text-[#6a7282]">{alert.id}</span>
        </div>
        <StatusBadge status={alert.status} />
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`size-10 flex items-center justify-center ${isActive ? "bg-[#ef4444]" : "bg-black"}`}>
          <span className="font-mono text-[11px] text-white">
            {alert.userName.split(" ").map(n => n[0]).join("")}
          </span>
        </div>
        <div>
          <p className="font-mono text-[11px] text-black">{alert.userName}</p>
          <p className="font-mono text-[8px] text-[#6a7282]">with {alert.driverName}</p>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-start gap-2 mb-2">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-0.5 shrink-0">
          <path d="M6 6.5C6.83 6.5 7.5 5.83 7.5 5C7.5 4.17 6.83 3.5 6 3.5C5.17 3.5 4.5 4.17 4.5 5C4.5 5.83 5.17 6.5 6 6.5Z" stroke="#ef4444" />
          <path d="M6 11C6 11 10 7.5 10 5C10 2.79 8.21 1 6 1C3.79 1 2 2.79 2 5C2 7.5 6 11 6 11Z" stroke="#ef4444" />
        </svg>
        <span className="font-mono text-[9px] text-black">{alert.location}</span>
      </div>

      {/* Time */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#e5e7eb]">
        <span className="font-mono text-[7px] text-[#99a1af]">TRIGGERED</span>
        <span className={`font-mono text-[8px] ${isActive ? "text-[#ef4444]" : "text-[#6a7282]"}`}>
          {alert.triggeredAt}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function SOSAlertsPage() {
  const [alerts, setAlerts] = useState(MOCK_SOS_ALERTS);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [resolutionNote, setResolutionNote] = useState("");

  const selectedAlert = alerts.find(a => a.id === selectedId);

  const filteredAlerts = alerts.filter(a => {
    return statusFilter === "ALL" || a.status === statusFilter;
  });

  const activeCount = alerts.filter(a => a.status === "ACTIVE").length;
  const resolvedCount = alerts.filter(a => a.status === "RESOLVED").length;

  const handleResolve = (id) => {
    setAlerts(prev => prev.map(a => 
      a.id === id 
        ? { 
            ...a, 
            status: "RESOLVED", 
            resolvedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
            resolvedBy: "Admin",
            resolutionNote: resolutionNote || "Resolved by admin"
          } 
        : a
    ));
    setResolutionNote("");
  };

  return (
    <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
      <AdminNavigation activePage="sos" />

      {/* Alert Hero Bar */}
      <div className={`h-[72px] shrink-0 flex items-center justify-between px-6 ${activeCount > 0 ? "bg-[#ef4444]" : "bg-black"}`}>
        <div className="flex items-center gap-4">
          {activeCount > 0 && (
            <div className="size-10 bg-white/20 flex items-center justify-center animate-pulse">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L2 18H18L10 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M10 8V11M10 14V14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
          <div>
            <h1 className="font-mono text-[20px] text-white tracking-[0.5px]">SOS ALERTS</h1>
            <p className="font-mono text-[9px] text-white/70 tracking-[2px] mt-0.5">
              {activeCount > 0 ? `${activeCount} ACTIVE EMERGENCY ALERT${activeCount > 1 ? "S" : ""}` : "All clear - No active alerts"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <div className="border border-white px-4 py-2 flex items-center gap-2 animate-pulse">
              <div className="size-2 rounded-full bg-white" />
              <span className="font-mono text-[11px] text-white">{activeCount} ACTIVE</span>
            </div>
          )}
          <div className="border border-white/50 px-3 py-1">
            <span className="font-mono text-[9px] text-white/70">{resolvedCount} RESOLVED TODAY</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Panel - Alert List */}
        <aside className="w-[400px] shrink-0 border-r border-[#e5e7eb] flex flex-col overflow-hidden">
          {/* Filter Bar */}
          <div className="h-[48px] shrink-0 border-b border-[#e5e7eb] flex items-center px-4">
            <div className="flex items-center border border-[#d1d5dc] h-[32px]">
              {["ACTIVE", "RESOLVED", "ALL"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`h-full px-4 font-mono text-[8px] tracking-[0.5px] transition-colors ${
                    statusFilter === status 
                      ? status === "ACTIVE" ? "bg-[#ef4444] text-white" : "bg-black text-white"
                      : "text-[#6a7282] hover:bg-gray-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="size-16 bg-[#10b981]/10 flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="9" stroke="#10b981" strokeWidth="2" />
                  </svg>
                </div>
                <p className="font-mono text-[11px] text-[#10b981]">NO {statusFilter} ALERTS</p>
                <p className="font-mono text-[8px] text-[#99a1af] mt-1">All clear for now</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <SOSAlertCard
                  key={alert.id}
                  alert={alert}
                  isSelected={selectedId === alert.id}
                  onSelect={() => setSelectedId(alert.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Right Panel - Detail / Map */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedAlert ? (
            <>
              {/* Detail Header */}
              <div className={`h-[60px] shrink-0 border-b border-[#e5e7eb] flex items-center justify-between px-6 ${selectedAlert.status === "ACTIVE" ? "bg-[#fef2f2]" : "bg-white"}`}>
                <div className="flex items-center gap-3">
                  <AlertTypeBadge type={selectedAlert.type} />
                  <span className="font-mono text-[14px] text-black">{selectedAlert.id}</span>
                  <StatusBadge status={selectedAlert.status} />
                </div>
                <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-white/50 rounded">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M9 3L3 9M3 3L9 9" stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Map Placeholder */}
              <div className="flex-1 bg-[#f3f4f6] relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`size-20 mx-auto mb-4 flex items-center justify-center ${selectedAlert.status === "ACTIVE" ? "bg-[#ef4444] animate-pulse" : "bg-black"}`}>
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path d="M16 8V16L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2" />
                      </svg>
                    </div>
                    <p className="font-mono text-[12px] text-black mb-1">LOCATION</p>
                    <p className="font-mono text-[14px] text-black font-semibold">{selectedAlert.location}</p>
                    <p className="font-mono text-[9px] text-[#6a7282] mt-1">
                      {selectedAlert.lat.toFixed(4)}, {selectedAlert.lng.toFixed(4)}
                    </p>
                    <p className="font-mono text-[8px] text-[#99a1af] mt-4">
                      [CAMPUS MAP INTEGRATION]
                    </p>
                  </div>
                </div>
              </div>

              {/* Detail Footer */}
              <div className="h-auto shrink-0 border-t border-[#e5e7eb] bg-white">
                {/* Info Grid */}
                <div className="grid grid-cols-3 gap-px bg-[#e5e7eb]">
                  <div className="bg-white p-3">
                    <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">USER</p>
                    <p className="font-mono text-[10px] text-black mt-1">{selectedAlert.userName}</p>
                    <p className="font-mono text-[8px] text-[#6a7282]">{selectedAlert.contactPhone}</p>
                  </div>
                  <div className="bg-white p-3">
                    <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">DRIVER</p>
                    <p className="font-mono text-[10px] text-black mt-1">{selectedAlert.driverName}</p>
                    <p className="font-mono text-[8px] text-[#6a7282]">Ride {selectedAlert.rideId}</p>
                  </div>
                  <div className="bg-white p-3">
                    <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">TRIGGERED</p>
                    <p className="font-mono text-[10px] text-black mt-1">{selectedAlert.triggeredAt}</p>
                    {selectedAlert.resolvedAt && (
                      <p className="font-mono text-[8px] text-[#10b981]">Resolved: {selectedAlert.resolvedAt}</p>
                    )}
                  </div>
                </div>

                {/* Resolution Info or Actions */}
                {selectedAlert.status === "RESOLVED" ? (
                  <div className="p-4 border-t border-[#e5e7eb] bg-[#f0fdf4]">
                    <p className="font-mono text-[7px] text-[#10b981] tracking-[1.5px] mb-2">
                      RESOLVED BY {selectedAlert.resolvedBy?.toUpperCase()}
                    </p>
                    <p className="font-mono text-[10px] text-[#166534]">{selectedAlert.resolutionNote}</p>
                  </div>
                ) : (
                  <div className="p-4 border-t border-[#e5e7eb]">
                    <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-2">RESOLUTION NOTE</p>
                    <textarea
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Enter resolution details..."
                      className="w-full h-[60px] border border-[#d1d5dc] p-2 font-mono text-[9px] text-black resize-none outline-none focus:border-black placeholder:text-[#d1d5dc]"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <button className="h-[36px] px-4 border border-[#ef4444] font-mono text-[9px] text-[#ef4444] tracking-[0.5px] hover:bg-[#ef4444] hover:text-white transition-colors">
                        DISPATCH SECURITY
                      </button>
                      <button
                        onClick={() => handleResolve(selectedAlert.id)}
                        className="h-[36px] px-6 bg-[#10b981] font-mono text-[9px] text-white tracking-[0.5px] hover:bg-green-600 transition-colors"
                      >
                        MARK RESOLVED
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#f9f9f9]">
              <div className="text-center">
                <div className="size-20 mx-auto bg-[#e5e7eb] flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 8V16L20 20" stroke="#99a1af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="16" cy="16" r="10" stroke="#99a1af" strokeWidth="2" />
                  </svg>
                </div>
                <p className="font-mono text-[11px] text-[#6a7282]">SELECT AN ALERT</p>
                <p className="font-mono text-[8px] text-[#99a1af] mt-1">Click on an alert to view details</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className={`h-[32px] shrink-0 border-t border-[#e5e7eb] flex items-center px-6 justify-between ${activeCount > 0 ? "bg-[#fef2f2]" : "bg-[#f9f9f9]"}`}>
        <span className={`font-mono text-[8px] tracking-[0.5px] ${activeCount > 0 ? "text-[#ef4444]" : "text-[#6a7282]"}`}>
          {activeCount > 0 ? `⚠ ${activeCount} ACTIVE SOS ALERT${activeCount > 1 ? "S" : ""} - REQUIRES ATTENTION` : "✓ ALL CLEAR - NO ACTIVE ALERTS"}
        </span>
        <span className="font-mono text-[8px] text-[#99a1af] tracking-[0.5px]">MONITORING LIVE</span>
      </footer>
    </div>
  );
}
