import { useState, useEffect } from "react";
import { AdminNavigation } from "../components/AdminNavigation";
import {
  getVerificationQueue,
  getProcessedVerifications,
  approveVerification,
  rejectVerification,
  getDriverVerificationQueue,
  getProcessedDriverVerifications,
  approveDriverVerification,
  rejectDriverVerification,
  subscribeToVerifications,
} from "../../../shared/lib/supabase";

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    PENDING:  "bg-[#f59e0b]",
    ACTIVE:   "bg-[#10b981]",
    APPROVED: "bg-[#10b981]",
    REJECTED: "bg-[#ef4444]",
    REVOKED:  "bg-[#6a7282]",
  };
  const label = status === "ACTIVE" ? "APPROVED" : status;
  return (
    <div className={`${map[status] || "bg-black"} px-2 py-0.5 inline-flex`}>
      <span className="font-mono text-[7px] text-white tracking-[0.5px]">{label}</span>
    </div>
  );
}

// ─── Email domain check ───────────────────────────────────────────────────────
function isEduEmail(email = "") {
  return email.endsWith(".edu") || email.endsWith(".edu.ph");
}

// ─── Initials helper ──────────────────────────────────────────────────────────
function initials(name = "?") {
  return name.split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase() || "?";
}

function getDriverDocuments(user) {
  return [
    { label: "DRIVER LICENSE", url: user.license_front_url },
    { label: "LICENSE BACK", url: user.license_back_url },
    { label: "PLATE / VEHICLE FILE", url: user.vehicle_reg_url },
  ].filter((doc) => Boolean(doc.url));
}

function isPdfDocument(url = "") {
  return url.split("?")[0].toLowerCase().endsWith(".pdf");
}

function VerificationDocuments({ user, onPreview }) {
  const documents = getDriverDocuments(user);

  return (
    <div className="border border-[#e5e7eb] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px]">DRIVER DOCUMENTS</p>
        {user.docs_submitted_at && (
          <span className="font-mono text-[7px] text-[#6a7282]">
            {new Date(user.docs_submitted_at).toLocaleString()}
          </span>
        )}
      </div>

      {documents.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {documents.map((doc) => (
            <button
              key={doc.label}
              onClick={() => onPreview(doc)}
              className="border border-[#d1d5dc] p-3 text-left hover:border-black transition-colors"
            >
              <p className="font-mono text-[8px] text-black tracking-[0.8px] mb-1">{doc.label}</p>
              <p className="font-mono text-[8px] text-[#10b981]">VIEW FULL SIZE</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-[#d1d5dc] p-4">
          <p className="font-mono text-[9px] text-[#ef4444]">No driver documents uploaded.</p>
        </div>
      )}
    </div>
  );
}

// ─── Verification Card (pending list) ────────────────────────────────────────
function VerificationCard({ user, isSelected, onSelect, onApprove, onReject, actioning }) {
  return (
    <div
      className={`border ${isSelected ? "border-black bg-[#f9f9f9]" : "border-[#e5e7eb]"} p-4 cursor-pointer hover:border-black transition-colors`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-black size-10 flex items-center justify-center shrink-0">
            <span className="font-mono text-[12px] text-white">{initials(user.full_name)}</span>
          </div>
          <div>
            <p className="font-mono text-[11px] text-black">{user.full_name}</p>
            <p className="font-mono text-[9px] text-[#6a7282]">{user.email}</p>
          </div>
        </div>
        <StatusBadge status={user.account_status} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-0.5">STUDENT ID</p>
          <p className="font-mono text-[10px] text-black">{user.student_id ?? "—"}</p>
        </div>
        <div>
          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-0.5">SUBMITTED</p>
          <p className="font-mono text-[9px] text-[#6a7282]">
            {new Date(user.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mb-3">
        <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-1">UNIVERSITY</p>
        <span className="font-mono text-[8px] text-[#6a7282] border border-[#e5e7eb] px-2 py-0.5">
          {user.university ?? "—"}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onApprove(); }}
          disabled={actioning}
          className="flex-1 h-[32px] bg-[#10b981] flex items-center justify-center gap-1 hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4 7L8 3" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
          </svg>
          <span className="font-mono text-[8px] text-white tracking-[0.5px]">
            {actioning ? "..." : "APPROVE"}
          </span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onReject(); }}
          disabled={actioning}
          className="flex-1 h-[32px] bg-[#ef4444] flex items-center justify-center gap-1 hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="white" strokeLinecap="round" strokeWidth="1.2" />
          </svg>
          <span className="font-mono text-[8px] text-white tracking-[0.5px]">
            {actioning ? "..." : "REJECT"}
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function VerificationsPage() {
  const [pending,   setPending]   = useState([]);
  const [processed, setProcessed] = useState([]);
  const [driverPending, setDriverPending] = useState([]);
  const [driverProcessed, setDriverProcessed] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [filter,    setFilter]    = useState("ACCOUNT_PENDING");
  const [adminNotes, setAdminNotes] = useState("");
  const [actioning,  setActioning]  = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [loadError, setLoadError] = useState("");

  // ── Fetch both queues ──────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [q, p, dq, dp] = await Promise.all([
        getVerificationQueue(),
        getProcessedVerifications(),
        getDriverVerificationQueue(),
        getProcessedDriverVerifications(),
      ]);
      setPending(q);
      setProcessed(p);
      setDriverPending(dq);
      setDriverProcessed(dp);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load verification queues.";
      console.error("[admin-verifications]", message);
      setLoadError(message);
      setPending([]);
      setProcessed([]);
      setDriverPending([]);
      setDriverProcessed([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const unsub = subscribeToVerifications(fetchAll);
    return unsub;
  }, []);

  // ── Selected user (from either list) ──────────────────────────────────────
  const allUsers = [...pending, ...processed, ...driverPending, ...driverProcessed];
  const selectedUser = allUsers.find((u) => u.id === selectedId);
  const isDriverQueue = filter.startsWith("DRIVER");
  const selectedStatus = isDriverQueue
    ? (selectedUser?.driver_verification_status ?? "NOT_SUBMITTED")
    : (selectedUser?.account_status ?? "PENDING");

  // ── Approve ────────────────────────────────────────────────────────────────
  const handleApprove = async (userId) => {
    setActioning(true);
    const { error } = await approveVerification(userId);
    if (error) console.error("[approve]", error.message);
    else { setSelectedId(null); setAdminNotes(""); await fetchAll(); }
    setActioning(false);
  };

  // ── Reject ─────────────────────────────────────────────────────────────────
  const handleReject = async (userId) => {
    setActioning(true);
    const { error } = await rejectVerification(userId, adminNotes);
    if (error) console.error("[reject]", error.message);
    else { setSelectedId(null); setAdminNotes(""); await fetchAll(); }
    setActioning(false);
  };

  const handleApproveDriver = async (userId) => {
    setActioning(true);
    const { error } = await approveDriverVerification(userId);
    if (error) console.error("[approve-driver]", error.message);
    else { setSelectedId(null); setAdminNotes(""); await fetchAll(); }
    setActioning(false);
  };

  const handleRejectDriver = async (userId) => {
    setActioning(true);
    const { error } = await rejectDriverVerification(userId, adminNotes);
    if (error) console.error("[reject-driver]", error.message);
    else { setSelectedId(null); setAdminNotes(""); await fetchAll(); }
    setActioning(false);
  };

  const pendingCount = pending.length;
  const driverPendingCount = driverPending.length;
  const currentList =
    filter === "ACCOUNT_PENDING" ? pending :
    filter === "ACCOUNT_PROCESSED" ? processed :
    filter === "DRIVER_PENDING" ? driverPending :
    driverProcessed;

  return (
    <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
      <AdminNavigation activePage="verifications" />

      {/* Hero Bar */}
      <div className="bg-black h-[72px] shrink-0 flex items-center justify-between px-6">
        <div>
          <h1 className="font-mono text-[20px] text-white tracking-[0.5px]">VERIFICATION QUEUE</h1>
          <p className="font-mono text-[9px] text-[#d1d5dc] tracking-[2px] mt-0.5">
            {loading ? "Loading..." : `${pendingCount} account pending · ${driverPendingCount} driver pending`}
          </p>
        </div>
        <div className="flex items-center gap-3">
            {(pendingCount + driverPendingCount) > 0 && (
            <div className="bg-[#f59e0b] px-3 py-1 flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-white animate-pulse" />
                <span className="font-mono text-[10px] text-white">{pendingCount + driverPendingCount} PENDING</span>
            </div>
          )}
          <button
            onClick={fetchAll}
            className="border border-white/40 px-3 py-1 hover:border-white transition-colors"
          >
            <span className="font-mono text-[9px] text-white">↻ REFRESH</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Panel — Queue List */}
        <aside className="w-[360px] shrink-0 border-r border-[#e5e7eb] flex flex-col overflow-hidden">

          {/* Filter Tabs */}
          <div className="h-[44px] shrink-0 border-b border-[#e5e7eb] flex">
            {[
              { id: "ACCOUNT_PENDING", label: `ACCOUNT PENDING (${pendingCount})` },
              { id: "ACCOUNT_PROCESSED", label: `ACCOUNT PROCESSED (${processed.length})` },
              { id: "DRIVER_PENDING", label: `DRIVER PENDING (${driverPendingCount})` },
              { id: "DRIVER_PROCESSED", label: `DRIVER PROCESSED (${driverProcessed.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex-1 font-mono text-[9px] tracking-[1px] transition-colors ${
                  filter === tab.id ? "bg-black text-white" : "bg-white text-black hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {loadError ? (
              <div className="border border-[#ef4444] bg-[#fef2f2] p-4">
                <p className="font-mono text-[10px] text-[#991b1b] mb-2">ADMIN API UNREACHABLE</p>
                <p className="font-mono text-[9px] text-[#7f1d1d] leading-4">{loadError}</p>
                <button
                  onClick={fetchAll}
                  className="mt-3 h-[30px] px-3 bg-[#ef4444] font-mono text-[8px] text-white tracking-[0.5px]"
                >
                  RETRY
                </button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-40">
                <p className="font-mono text-[9px] text-[#99a1af] animate-pulse">LOADING...</p>
              </div>
            ) : filter.endsWith("PENDING") ? (
              currentList.length > 0 ? (
                currentList.map((u) => (
                  <VerificationCard
                    key={u.id}
                    user={u}
                    isSelected={selectedId === u.id}
                    onSelect={() => setSelectedId(u.id)}
                    onApprove={() => (isDriverQueue ? handleApproveDriver(u.id) : handleApprove(u.id))}
                    onReject={() => (isDriverQueue ? handleRejectDriver(u.id) : handleReject(u.id))}
                    actioning={actioning}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="bg-[#10b981] size-12 flex items-center justify-center mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12L10 17L20 7" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                  <p className="font-mono text-[11px] text-black mb-1">ALL CAUGHT UP!</p>
                  <p className="font-mono text-[9px] text-[#6a7282]">No pending verifications</p>
                </div>
              )
            ) : (
              currentList.length > 0 ? (
                currentList.map((u) => (
                  <div
                    key={u.id}
                    className={`border border-[#e5e7eb] p-3 cursor-pointer hover:border-black transition-colors ${selectedId === u.id ? "border-black bg-[#f9f9f9]" : ""}`}
                    onClick={() => setSelectedId(u.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-black">{u.full_name}</span>
                      <StatusBadge status={isDriverQueue ? u.driver_verification_status : u.account_status} />
                    </div>
                    <p className="font-mono text-[8px] text-[#6a7282]">{u.email}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-mono text-[8px] text-[#99a1af]">ID: {u.student_id ?? "—"}</span>
                      <span className="font-mono text-[8px] text-[#99a1af]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {(isDriverQueue ? u.driver_rejection_reason : u.suspend_reason) && (
                      <p className="font-mono text-[8px] text-[#ef4444] mt-2">Reason: {isDriverQueue ? u.driver_rejection_reason : u.suspend_reason}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-40">
                  <p className="font-mono text-[9px] text-[#99a1af]">NO PROCESSED RECORDS</p>
                </div>
              )
            )}
          </div>
        </aside>

        {/* Right Panel — Detail View */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="h-[60px] shrink-0 border-b border-[#e5e7eb] flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <div className="bg-black size-10 flex items-center justify-center">
                    <span className="font-mono text-[12px] text-white">{initials(selectedUser.full_name)}</span>
                  </div>
                  <div>
                    <p className="font-mono text-[12px] text-black">{selectedUser.full_name}</p>
                    <p className="font-mono text-[9px] text-[#6a7282]">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedStatus} />
                  <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-100 rounded">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M9 3L3 9M3 3L9 9" stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 gap-6">

                  {/* Left Column — Student Info */}
                  <div className="space-y-4">
                    <div className="border border-[#e5e7eb] p-4">
                      <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-3">STUDENT INFORMATION</p>
                      <div className="space-y-3">
                        <div>
                          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">FULL NAME</p>
                          <p className="font-mono text-[11px] text-black">{selectedUser.full_name}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">EMAIL</p>
                          <p className="font-mono text-[11px] text-black break-all">{selectedUser.email}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">STUDENT ID</p>
                          <p className="font-mono text-[11px] text-black">{selectedUser.student_id ?? "—"}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">UNIVERSITY</p>
                          <p className="font-mono text-[11px] text-black">{selectedUser.university ?? "—"}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">PHONE</p>
                          <p className="font-mono text-[11px] text-black">{selectedUser.phone_number ?? "—"}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">REGISTERED ROLE</p>
                          <p className="font-mono text-[11px] text-black">{selectedUser.role ?? "RIDER"}</p>
                        </div>
                        {isDriverQueue && (
                          <>
                            <div>
                              <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">ADDRESS</p>
                              <p className="font-mono text-[11px] text-black">{selectedUser.driver_full_address ?? "—"}</p>
                            </div>
                            <div>
                              <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">COLLEGE / COURSE</p>
                              <p className="font-mono text-[11px] text-black">{selectedUser.driver_college ?? "—"} / {selectedUser.driver_course ?? "—"}</p>
                            </div>
                            <div>
                              <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">PLATE / LICENSE</p>
                              <p className="font-mono text-[11px] text-black">{selectedUser.driver_plate_number ?? "—"} / {selectedUser.driver_license_number ?? "—"}</p>
                            </div>
                          </>
                        )}
                        <div>
                          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">SUBMITTED AT</p>
                          <p className="font-mono text-[10px] text-[#6a7282]">
                            {new Date(selectedUser.docs_submitted_at ?? selectedUser.updated_at ?? selectedUser.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Email Validation */}
                    <div className="border border-[#e5e7eb] p-4">
                      <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-3">EMAIL VALIDATION</p>
                      <div className="flex items-center gap-2">
                        {isEduEmail(selectedUser.email) ? (
                          <>
                            <div className="size-6 bg-[#10b981] flex items-center justify-center">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-mono text-[10px] text-[#10b981]">VALID .EDU EMAIL</p>
                              <p className="font-mono text-[8px] text-[#6a7282]">Institutional domain verified</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="size-6 bg-[#ef4444] flex items-center justify-center">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M3 3L9 9M9 3L3 9" stroke="white" strokeLinecap="round" strokeWidth="1.5" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-mono text-[10px] text-[#ef4444]">INVALID EMAIL DOMAIN</p>
                              <p className="font-mono text-[8px] text-[#6a7282]">Must use institutional email</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column — Avatar + Notes */}
                  <div className="space-y-4">
                    {/* Avatar / ID Photo */}
                    <div className="border border-[#e5e7eb] p-4">
                      <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-3">PROFILE PHOTO</p>
                      <div className="bg-[#f3f4f6] aspect-[3/2] flex items-center justify-center border border-dashed border-[#d1d5dc]">
                        {selectedUser.avatar_url ? (
                          <img src={selectedUser.avatar_url} alt="Avatar" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="bg-black size-16 flex items-center justify-center">
                              <span className="font-mono text-[24px] text-white">{initials(selectedUser.full_name)}</span>
                            </div>
                            <span className="font-mono text-[9px] text-[#99a1af]">No photo uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rejection reason — shown for processed rejections */}
                    {isDriverQueue && (
                      <VerificationDocuments user={selectedUser} onPreview={setDocumentPreview} />
                    )}

                    {(isDriverQueue ? selectedUser.driver_verification_status === "REJECTED" : selectedUser.account_status === "REJECTED") &&
                      (isDriverQueue ? selectedUser.driver_rejection_reason : selectedUser.suspend_reason) && (
                      <div className="border border-[#ef4444] p-4 bg-[#fef2f2]">
                        <p className="font-mono text-[8px] text-[#ef4444] tracking-[1.5px] mb-2">REJECTION REASON</p>
                        <p className="font-mono text-[10px] text-[#991b1b]">{isDriverQueue ? selectedUser.driver_rejection_reason : selectedUser.suspend_reason}</p>
                      </div>
                    )}

                    {/* Admin Notes — shown only for pending */}
                    {selectedStatus === "PENDING" && (
                      <div className="border border-[#e5e7eb] p-4">
                        <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-3">REJECTION NOTES</p>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add reason for rejection (optional)..."
                          rows={4}
                          className="w-full border border-[#d1d5dc] p-2 font-mono text-[10px] text-black resize-none outline-none focus:border-black placeholder:text-[#d1d5dc]"
                        />
                        <p className="font-mono text-[7px] text-[#99a1af] mt-1">
                          Only required when rejecting. Leave blank for default message.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar — only for pending */}
              {selectedStatus === "PENDING" && (
                <div className="h-[60px] shrink-0 border-t border-[#e5e7eb] flex items-center justify-end gap-3 px-6">
                  <button
                    onClick={() => (isDriverQueue ? handleRejectDriver(selectedUser.id) : handleReject(selectedUser.id))}
                    disabled={actioning}
                    className="h-[38px] px-6 bg-[#ef4444] flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 3L9 9M9 3L3 9" stroke="white" strokeLinecap="round" strokeWidth="1.5" />
                    </svg>
                    <span className="font-mono text-[10px] text-white tracking-[0.5px]">
                      {actioning ? "PROCESSING..." : "REJECT APPLICATION"}
                    </span>
                  </button>
                  <button
                    onClick={() => (isDriverQueue ? handleApproveDriver(selectedUser.id) : handleApprove(selectedUser.id))}
                    disabled={actioning}
                    className="h-[38px] px-6 bg-[#10b981] flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                    <span className="font-mono text-[10px] text-white tracking-[0.5px]">
                      {actioning ? "PROCESSING..." : isDriverQueue ? "APPROVE DRIVER ACCESS" : "APPROVE & VERIFY"}
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-[#f3f4f6] size-16 mx-auto mb-4 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M26 10L12 24L6 18" stroke="#99a1af" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  </svg>
                </div>
                <p className="font-mono text-[11px] text-black mb-1">SELECT A VERIFICATION</p>
                <p className="font-mono text-[9px] text-[#6a7282]">Click on a request to review details</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="h-[32px] shrink-0 bg-[#f9f9f9] border-t border-[#e5e7eb] flex items-center px-6 justify-between">
        <span className="font-mono text-[8px] text-[#6a7282] tracking-[0.5px]">
          {loading ? "LOADING..." : `ACCOUNT: ${pendingCount} PENDING · ${processed.length} PROCESSED · DRIVER: ${driverPendingCount} PENDING · ${driverProcessed.length} PROCESSED`}
        </span>
        <span className="font-mono text-[8px] text-[#99a1af] tracking-[0.5px]">LIVE · SUPABASE</span>
      </footer>

      {documentPreview && (
        <div className="fixed inset-0 z-[2147483647] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-[920px] h-[86vh] bg-white border border-black flex flex-col">
            <div className="h-[48px] shrink-0 border-b border-black px-4 flex items-center justify-between">
              <p className="font-mono text-[11px] text-black tracking-[0.8px]">{documentPreview.label}</p>
              <button onClick={() => setDocumentPreview(null)} className="font-mono text-[10px] text-[#6a7282]">
                CLOSE
              </button>
            </div>
            <div className="flex-1 min-h-0 bg-[#f3f4f6] flex items-center justify-center p-4">
              {isPdfDocument(documentPreview.url) ? (
                <iframe title={documentPreview.label} src={documentPreview.url} className="w-full h-full bg-white border border-[#d1d5dc]" />
              ) : (
                <img src={documentPreview.url} alt={documentPreview.label} className="max-w-full max-h-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
