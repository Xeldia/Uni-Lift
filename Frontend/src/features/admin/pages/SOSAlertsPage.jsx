import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { AdminNavigation } from "../components/AdminNavigation";
import { subscribeToSOS, resolveSOS, assignSOS, callEmergencyForSOS } from "../../../shared/lib/supabase";

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
  const triggeredTime = new Date(alert.triggered_at).toLocaleString();

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
          <span className="font-mono text-[9px] text-[#6a7282]">{alert.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <StatusBadge status={alert.status} />
      </div>

      {/* Location */}
      <div className="flex items-start gap-2 mb-2">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-0.5 shrink-0">
          <path d="M6 6.5C6.83 6.5 7.5 5.83 7.5 5C7.5 4.17 6.83 3.5 6 3.5C5.17 3.5 4.5 4.17 4.5 5C4.5 5.83 5.17 6.5 6 6.5Z" stroke="#ef4444" />
          <path d="M6 11C6 11 10 7.5 10 5C10 2.79 8.21 1 6 1C3.79 1 2 2.79 2 5C2 7.5 6 11 6 11Z" stroke="#ef4444" />
        </svg>
        <span className="font-mono text-[9px] text-black">{alert.location ?? "Location unknown"}</span>
      </div>

      {alert.ride_id && (
        <p className="font-mono text-[8px] text-[#6a7282] mb-2">Ride: {alert.ride_id.slice(0, 8)}</p>
      )}
      {alert.assigned_to && (
        <p className="font-mono text-[8px] text-[#2563eb] mb-2">Assigned: {alert.assigned_to}</p>
      )}

      {/* Time */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#e5e7eb]">
        <span className="font-mono text-[7px] text-[#99a1af]">TRIGGERED</span>
        <span className={`font-mono text-[8px] ${isActive ? "text-[#ef4444]" : "text-[#6a7282]"}`}>
          {triggeredTime}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function SOSAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolving, setResolving] = useState(false);
  const [assigneeDraft, setAssigneeDraft] = useState("");
  const [assigning, setAssigning] = useState(false);
  // Emergency call simulation: "IDLE" | "CALLING" | "DISPATCHED"
  const [callState, setCallState] = useState("IDLE");
  const callTimerRef = useRef(null);

  // ── Subscribe to all SOS alerts from Supabase ─────────────────────────────
  useEffect(() => {
    const unsub = subscribeToSOS((data) => setAlerts(data));
    return unsub;
  }, []);

  const selectedAlert = alerts.find((a) => a.id === selectedId);
  const filteredAlerts = alerts.filter((a) => {
    const q = searchQuery.trim().toLowerCase();
    const triggeredDate = a.triggered_at ? new Date(a.triggered_at).toISOString().slice(0, 10) : "";
    const searchable = [
      a.id,
      a.user_id,
      a.ride_id,
      a.type,
      a.status,
      a.location,
      a.assigned_to,
      a.resolution_note,
      a.resolved_by,
    ].filter(Boolean).join(" ").toLowerCase();

    return (
      (statusFilter === "ALL" || a.status === statusFilter) &&
      (typeFilter === "ALL" || a.type === typeFilter) &&
      (!dateFilter || triggeredDate === dateFilter) &&
      (!q || searchable.includes(q))
    );
  });

  const activeCount = alerts.filter((a) => a.status === "ACTIVE").length;
  const resolvedCount = alerts.filter((a) => a.status === "RESOLVED").length;

  const handleResolve = async (alertId) => {
    if (!resolutionNote.trim()) {
      toast.error("Please enter a resolution note.");
      return;
    }
    setResolving(true);
    const { error } = await resolveSOS(alertId, "ADMIN", resolutionNote);
    if (error) {
      toast.error("Failed to resolve alert.");
    } else {
      toast.success("Alert resolved.");
      setResolutionNote("");
    }
    setResolving(false);
  };

  const handleAssign = async (alertId) => {
    if (!assigneeDraft.trim()) {
      toast.error("Please enter an assignee name.");
      return;
    }
    setAssigning(true);
    const { error } = await assignSOS(alertId, assigneeDraft.trim());
    if (error) {
      toast.error("Failed to assign alert.");
    } else {
      toast.success(`Assigned to ${assigneeDraft.trim()}.`);
    }
    setAssigning(false);
  };

  useEffect(() => {
    setAssigneeDraft(selectedAlert?.assigned_to ?? "");
    // Reset call simulation whenever a new alert is selected
    setCallState("IDLE");
    if (callTimerRef.current) clearTimeout(callTimerRef.current);
  }, [selectedAlert?.id]);

  const handleCallEmergency = async (alertId) => {
    if (callState !== "IDLE") return;
    setCallState("CALLING");
    // Simulate a ~3s dispatch sequence then mark dispatched
    callTimerRef.current = setTimeout(async () => {
      setCallState("DISPATCHED");
      await callEmergencyForSOS(alertId);
    }, 3000);
  };

  const exportCsv = () => {
    const headers = ["id", "status", "type", "user_id", "ride_id", "location", "lat", "lng", "assigned_to", "triggered_at", "resolved_at", "resolved_by", "resolution_note"];
    const rows = filteredAlerts.map((a) => ({
      id: a.id,
      status: a.status,
      type: a.type,
      user_id: a.user_id,
      ride_id: a.ride_id ?? "",
      location: a.location ?? "",
      lat: a.lat ?? "",
      lng: a.lng ?? "",
      assigned_to: a.assigned_to ?? "",
      triggered_at: a.triggered_at,
      resolved_at: a.resolved_at ?? "",
      resolved_by: a.resolved_by ?? "",
      resolution_note: a.resolution_note ?? "",
    }));
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sos-alerts-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
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
              {activeCount > 0 ? `${activeCount} ACTIVE EMERGENCY ALERT${activeCount > 1 ? "S" : ""}` : "All clear — No active alerts"}
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
            <span className="font-mono text-[9px] text-white/70">{resolvedCount} RESOLVED</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Panel - Alert List */}
        <aside className="w-[400px] shrink-0 border-r border-[#e5e7eb] flex flex-col overflow-hidden">
          {/* Filter Bar */}
          <div className="h-[132px] shrink-0 border-b border-[#e5e7eb] flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
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
              <button
                onClick={exportCsv}
                className="h-[32px] px-3 border border-black font-mono text-[8px] text-black tracking-[0.5px] hover:bg-black hover:text-white transition-colors"
              >
                EXPORT
              </button>
            </div>

            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alert, user, ride, location..."
              className="h-[30px] border border-[#d1d5dc] px-2 font-mono text-[9px] text-black outline-none placeholder:text-[#99a1af]"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-[30px] border border-[#d1d5dc] px-2 font-mono text-[8px] text-black outline-none bg-white"
              >
                <option value="ALL">ALL TYPES</option>
                <option value="ALARM">ALARM</option>
                <option value="SILENT">SILENT</option>
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-[30px] border border-[#d1d5dc] px-2 font-mono text-[8px] text-black outline-none"
              />
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

        {/* Right Panel - Detail */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedAlert ? (
            <>
              {/* Detail Header */}
              <div className={`h-[60px] shrink-0 border-b border-[#e5e7eb] flex items-center justify-between px-6 ${selectedAlert.status === "ACTIVE" ? "bg-[#fef2f2]" : "bg-white"}`}>
                <div className="flex items-center gap-3">
                  <AlertTypeBadge type={selectedAlert.type} />
                  <span className="font-mono text-[14px] text-black">{selectedAlert.id.slice(0, 8).toUpperCase()}</span>
                  <StatusBadge status={selectedAlert.status} />
                </div>
                <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-white/50 rounded">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M9 3L3 9M3 3L9 9" stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Location Display */}
              <div className="flex-1 bg-[#f9f9f9] flex items-center justify-center">
                <div className="text-center">
                  <div className={`size-20 mx-auto mb-4 flex items-center justify-center ${selectedAlert.status === "ACTIVE" ? "bg-[#ef4444] animate-pulse" : "bg-black"}`}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M16 8V16L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2" />
                    </svg>
                  </div>
                  <p className="font-mono text-[12px] text-black mb-1">LOCATION</p>
                  <p className="font-mono text-[14px] text-black font-semibold">{selectedAlert.location ?? "Unknown"}</p>
                  {selectedAlert.lat && (
                    <p className="font-mono text-[9px] text-[#6a7282] mt-1">
                      {selectedAlert.lat.toFixed(4)}, {selectedAlert.lng?.toFixed(4)}
                    </p>
                  )}
                  <p className="font-mono text-[8px] text-[#99a1af] mt-4">
                    Ride ID: {selectedAlert.ride_id?.slice(0, 8) ?? "—"}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-[#e5e7eb] bg-white">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-px bg-[#e5e7eb]">
                  <div className="bg-white p-3">
                    <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">TRIGGERED</p>
                    <p className="font-mono text-[10px] text-black mt-1">
                      {new Date(selectedAlert.triggered_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-3">
                    <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">TYPE</p>
                    <p className="font-mono text-[10px] text-black mt-1">{selectedAlert.type}</p>
                  </div>
                </div>

                {/* Resolution */}
                {selectedAlert.status === "RESOLVED" ? (
                  <div className="p-4 border-t border-[#e5e7eb] bg-[#f0fdf4]">
                    <p className="font-mono text-[7px] text-[#10b981] tracking-[1.5px] mb-2">
                      RESOLVED BY {selectedAlert.resolved_by?.toUpperCase() ?? "ADMIN"}
                    </p>
                    <p className="font-mono text-[10px] text-[#166534]">{selectedAlert.resolution_note}</p>
                  </div>
                ) : (
                  <div className="border-t border-[#e5e7eb]">
                    {/* ── CALL EMERGENCY STAFF ── */}
                    <div className="p-4 border-b border-[#e5e7eb]">
                      {callState === "IDLE" && (
                        <button
                          id="btn-call-emergency"
                          onClick={() => handleCallEmergency(selectedAlert.id)}
                          className="w-full h-[52px] bg-[#ef4444] flex items-center justify-center gap-3 hover:bg-red-600 active:scale-95 transition-all shadow-md shadow-red-200"
                        >
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M6.5 2H3.5C2.95 2 2.5 2.45 2.5 3C2.5 10.45 8.55 16.5 16 16.5C16.55 16.5 17 16.05 17 15.5V12.5L13.5 11L12.07 12.43C10.61 11.72 9.28 10.39 8.57 8.93L10 7.5L8.5 4H6.5Z" fill="white" />
                          </svg>
                          <span className="font-mono text-[13px] text-white tracking-[1px] font-bold">CALL EMERGENCY STAFF</span>
                        </button>
                      )}

                      {callState === "CALLING" && (
                        <div className="w-full h-[52px] bg-[#dc2626] flex items-center justify-center gap-3 relative overflow-hidden">
                          <span className="absolute inset-0 bg-white/10 animate-ping" />
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="animate-bounce">
                            <path d="M6.5 2H3.5C2.95 2 2.5 2.45 2.5 3C2.5 10.45 8.55 16.5 16 16.5C16.55 16.5 17 16.05 17 15.5V12.5L13.5 11L12.07 12.43C10.61 11.72 9.28 10.39 8.57 8.93L10 7.5L8.5 4H6.5Z" fill="white" />
                          </svg>
                          <span className="font-mono text-[13px] text-white tracking-[1px] font-bold">CALLING<span className="animate-pulse">...</span></span>
                        </div>
                      )}

                      {callState === "DISPATCHED" && (
                        <div className="w-full h-[52px] bg-[#10b981] flex items-center justify-center gap-3">
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M3 9L7 13L15 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="font-mono text-[13px] text-white tracking-[1px] font-bold">EMERGENCY DISPATCHED</span>
                        </div>
                      )}

                      <p className="font-mono text-[7px] text-[#99a1af] text-center mt-2 tracking-[0.5px]">
                        {callState === "DISPATCHED" ? "Emergency services have been contacted" : "Contacts on-call emergency responders"}
                      </p>
                    </div>

                    {/* ── ASSIGN + RESOLVE ── */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1">
                          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-1">ASSIGNED TO</p>
                          <input
                            type="text"
                            value={assigneeDraft}
                            onChange={(e) => setAssigneeDraft(e.target.value)}
                            placeholder="Responder name..."
                            className="w-full h-[32px] border border-[#d1d5dc] px-2 font-mono text-[9px] text-black outline-none focus:border-black placeholder:text-[#d1d5dc]"
                          />
                        </div>
                        <button
                          onClick={() => handleAssign(selectedAlert.id)}
                          disabled={assigning}
                          className="h-[32px] px-3 border border-black font-mono text-[8px] text-black tracking-[0.5px] hover:bg-black hover:text-white transition-colors disabled:opacity-50 mt-[14px]"
                        >
                          {assigning ? "..." : "ASSIGN"}
                        </button>
                      </div>
                      <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-2">RESOLUTION NOTE</p>
                      <textarea
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Enter resolution details..."
                        className="w-full h-[60px] border border-[#d1d5dc] p-2 font-mono text-[9px] text-black resize-none outline-none focus:border-black placeholder:text-[#d1d5dc]"
                      />
                      <div className="flex items-center justify-end mt-3">
                        <button
                          onClick={() => handleResolve(selectedAlert.id)}
                          disabled={resolving}
                          className="h-[36px] px-6 bg-[#10b981] font-mono text-[9px] text-white tracking-[0.5px] hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          {resolving ? "RESOLVING..." : "✓ MARK RESOLVED"}
                        </button>
                      </div>
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
                <p className="font-mono text-[8px] text-[#99a1af] mt-1">Click on an alert to view details and resolve</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className={`h-[32px] shrink-0 border-t border-[#e5e7eb] flex items-center px-6 justify-between ${activeCount > 0 ? "bg-[#fef2f2]" : "bg-[#f9f9f9]"}`}>
        <span className={`font-mono text-[8px] tracking-[0.5px] ${activeCount > 0 ? "text-[#ef4444]" : "text-[#6a7282]"}`}>
          {activeCount > 0 ? `⚠ ${activeCount} ACTIVE SOS ALERT${activeCount > 1 ? "S" : ""} — REQUIRES ATTENTION` : "✓ ALL CLEAR — NO ACTIVE ALERTS"}
        </span>
        <span className="font-mono text-[8px] text-[#99a1af] tracking-[0.5px]">MONITORING LIVE · REAL-TIME</span>
      </footer>
    </div>
  );
}
