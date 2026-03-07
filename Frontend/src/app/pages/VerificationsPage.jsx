import { useState } from "react";
import { AdminNavigation } from "../components/AdminNavigation";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_VERIFICATIONS = [
  {
    id: "V001",
    userId: "U1001",
    name: "Juan Dela Cruz",
    email: "j.delacruz@cit.edu",
    studentId: "2024-0001",
    idPhotoUrl: "https://via.placeholder.com/300x200?text=Student+ID",
    status: "PENDING",
    submittedAt: "2026-03-07T10:30:00Z",
    documents: ["Student ID", "Enrollment Form"],
  },
  {
    id: "V002",
    userId: "U1002",
    name: "Maria Santos",
    email: "m.santos@cit.edu",
    studentId: "2024-0015",
    idPhotoUrl: "https://via.placeholder.com/300x200?text=Student+ID",
    status: "PENDING",
    submittedAt: "2026-03-07T09:15:00Z",
    documents: ["Student ID"],
  },
  {
    id: "V003",
    userId: "U1003",
    name: "Pedro Reyes",
    email: "p.reyes@cit.edu",
    studentId: "2024-0089",
    idPhotoUrl: "https://via.placeholder.com/300x200?text=Student+ID",
    status: "PENDING",
    submittedAt: "2026-03-07T08:00:00Z",
    documents: ["Student ID", "Driver's License"],
  },
  {
    id: "V004",
    userId: "U1004",
    name: "Ana Garcia",
    email: "a.garcia@cit.edu",
    studentId: "2024-0102",
    idPhotoUrl: "https://via.placeholder.com/300x200?text=Student+ID",
    status: "PENDING",
    submittedAt: "2026-03-06T16:45:00Z",
    documents: ["Student ID"],
  },
  {
    id: "V005",
    userId: "U1005",
    name: "Carlos Mendoza",
    email: "c.mendoza@usc.edu.ph",
    studentId: "2024-5521",
    idPhotoUrl: "https://via.placeholder.com/300x200?text=Student+ID",
    status: "PENDING",
    submittedAt: "2026-03-06T14:20:00Z",
    documents: ["Student ID", "Vehicle Registration"],
  },
];

const PROCESSED_VERIFICATIONS = [
  { id: "V100", name: "Emma Wilson", email: "e.wilson@cit.edu", studentId: "2023-0445", status: "APPROVED", processedAt: "2 hours ago", processedBy: "Admin" },
  { id: "V101", name: "Fake User", email: "fake@gmail.com", studentId: "0000-0000", status: "REJECTED", processedAt: "3 hours ago", processedBy: "Admin", reason: "Invalid .edu email" },
  { id: "V102", name: "Leo Martinez", email: "l.martinez@cit.edu", studentId: "2023-0891", status: "APPROVED", processedAt: "5 hours ago", processedBy: "Admin" },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    PENDING: "bg-[#f59e0b]",
    APPROVED: "bg-[#10b981]",
    REJECTED: "bg-[#ef4444]",
  };
  return (
    <div className={`${colors[status] || "bg-black"} px-2 py-0.5 inline-flex`}>
      <span className="font-mono text-[7px] text-white tracking-[0.5px]">{status}</span>
    </div>
  );
}

// ─── Verification Card ────────────────────────────────────────────────────────
function VerificationCard({ verification, isSelected, onSelect, onApprove, onReject }) {
  const timeAgo = new Date(verification.submittedAt).toLocaleString();

  return (
    <div
      className={`border ${isSelected ? "border-black bg-[#f9f9f9]" : "border-[#e5e7eb]"} p-4 cursor-pointer hover:border-black transition-colors`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-black size-10 flex items-center justify-center shrink-0">
            <span className="font-mono text-[12px] text-white">
              {verification.name.split(" ").map(n => n[0]).join("")}
            </span>
          </div>
          <div>
            <p className="font-mono text-[11px] text-black">{verification.name}</p>
            <p className="font-mono text-[9px] text-[#6a7282]">{verification.email}</p>
          </div>
        </div>
        <StatusBadge status={verification.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-0.5">STUDENT ID</p>
          <p className="font-mono text-[10px] text-black">{verification.studentId}</p>
        </div>
        <div>
          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-0.5">SUBMITTED</p>
          <p className="font-mono text-[9px] text-[#6a7282]">{timeAgo}</p>
        </div>
      </div>

      <div className="mb-3">
        <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-1">DOCUMENTS</p>
        <div className="flex flex-wrap gap-1">
          {verification.documents.map((doc, i) => (
            <span key={i} className="font-mono text-[8px] text-[#6a7282] border border-[#e5e7eb] px-2 py-0.5">
              {doc}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onApprove(); }}
          className="flex-1 h-[32px] bg-[#10b981] flex items-center justify-center gap-1 hover:bg-green-600 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4 7L8 3" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
          </svg>
          <span className="font-mono text-[8px] text-white tracking-[0.5px]">APPROVE</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onReject(); }}
          className="flex-1 h-[32px] bg-[#ef4444] flex items-center justify-center gap-1 hover:bg-red-600 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="white" strokeLinecap="round" strokeWidth="1.2" />
          </svg>
          <span className="font-mono text-[8px] text-white tracking-[0.5px]">REJECT</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function VerificationsPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [verifications, setVerifications] = useState(MOCK_VERIFICATIONS);
  const [processed, setProcessed] = useState(PROCESSED_VERIFICATIONS);
  const [filter, setFilter] = useState("PENDING");
  const [adminNotes, setAdminNotes] = useState("");

  const selectedVerification = verifications.find(v => v.id === selectedId) || processed.find(v => v.id === selectedId);

  const handleApprove = (id) => {
    const v = verifications.find(v => v.id === id);
    if (v) {
      setVerifications(prev => prev.filter(p => p.id !== id));
      setProcessed(prev => [{ ...v, status: "APPROVED", processedAt: "Just now", processedBy: "Admin" }, ...prev]);
    }
  };

  const handleReject = (id) => {
    const v = verifications.find(v => v.id === id);
    if (v) {
      setVerifications(prev => prev.filter(p => p.id !== id));
      setProcessed(prev => [{ ...v, status: "REJECTED", processedAt: "Just now", processedBy: "Admin", reason: adminNotes || "Did not meet requirements" }, ...prev]);
    }
  };

  const pendingCount = verifications.length;

  return (
    <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
      <AdminNavigation activePage="verifications" />

      {/* Hero Bar */}
      <div className="bg-black h-[72px] shrink-0 flex items-center justify-between px-6">
        <div>
          <h1 className="font-mono text-[20px] text-white tracking-[0.5px]">VERIFICATION QUEUE</h1>
          <p className="font-mono text-[9px] text-[#d1d5dc] tracking-[2px] mt-0.5">
            Review and approve student registrations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-[#f59e0b] px-3 py-1 flex items-center gap-2">
            <span className="font-mono text-[10px] text-white">{pendingCount} PENDING</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Panel - Verification List */}
        <aside className="w-[360px] shrink-0 border-r border-[#e5e7eb] flex flex-col overflow-hidden">

          {/* Filter Tabs */}
          <div className="h-[44px] shrink-0 border-b border-[#e5e7eb] flex">
            {["PENDING", "PROCESSED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-1 font-mono text-[9px] tracking-[1px] transition-colors ${
                  filter === tab ? "bg-black text-white" : "bg-white text-black hover:bg-gray-50"
                }`}
              >
                {tab} {tab === "PENDING" ? `(${pendingCount})` : `(${processed.length})`}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {filter === "PENDING" ? (
              verifications.length > 0 ? (
                verifications.map((v) => (
                  <VerificationCard
                    key={v.id}
                    verification={v}
                    isSelected={selectedId === v.id}
                    onSelect={() => setSelectedId(v.id)}
                    onApprove={() => handleApprove(v.id)}
                    onReject={() => handleReject(v.id)}
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
              processed.map((v) => (
                <div
                  key={v.id}
                  className={`border border-[#e5e7eb] p-3 cursor-pointer hover:border-black transition-colors ${selectedId === v.id ? "border-black bg-[#f9f9f9]" : ""}`}
                  onClick={() => setSelectedId(v.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-black">{v.name}</span>
                    <StatusBadge status={v.status} />
                  </div>
                  <p className="font-mono text-[8px] text-[#6a7282]">{v.email}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-[8px] text-[#99a1af]">ID: {v.studentId}</span>
                    <span className="font-mono text-[8px] text-[#99a1af]">{v.processedAt}</span>
                  </div>
                  {v.reason && (
                    <p className="font-mono text-[8px] text-[#ef4444] mt-2">Reason: {v.reason}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Panel - Detail View */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedVerification ? (
            <>
              {/* Header */}
              <div className="h-[60px] shrink-0 border-b border-[#e5e7eb] flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <div className="bg-black size-10 flex items-center justify-center">
                    <span className="font-mono text-[12px] text-white">
                      {selectedVerification.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-[12px] text-black">{selectedVerification.name}</p>
                    <p className="font-mono text-[9px] text-[#6a7282]">{selectedVerification.email}</p>
                  </div>
                </div>
                <StatusBadge status={selectedVerification.status} />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 gap-6">

                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Student Info */}
                    <div className="border border-[#e5e7eb] p-4">
                      <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-3">STUDENT INFORMATION</p>
                      <div className="space-y-3">
                        <div>
                          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">FULL NAME</p>
                          <p className="font-mono text-[11px] text-black">{selectedVerification.name}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">EMAIL (.EDU)</p>
                          <p className="font-mono text-[11px] text-black">{selectedVerification.email}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">STUDENT ID NUMBER</p>
                          <p className="font-mono text-[11px] text-black">{selectedVerification.studentId}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">SUBMITTED AT</p>
                          <p className="font-mono text-[10px] text-[#6a7282]">
                            {selectedVerification.submittedAt ? new Date(selectedVerification.submittedAt).toLocaleString() : selectedVerification.processedAt}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Email Validation */}
                    <div className="border border-[#e5e7eb] p-4">
                      <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-3">EMAIL VALIDATION</p>
                      <div className="flex items-center gap-2">
                        {selectedVerification.email.endsWith(".edu") || selectedVerification.email.endsWith(".edu.ph") ? (
                          <>
                            <div className="size-6 bg-[#10b981] flex items-center justify-center">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-mono text-[10px] text-[#10b981]">VALID .EDU EMAIL</p>
                              <p className="font-mono text-[8px] text-[#6a7282]">Domain verified</p>
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

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* ID Photo */}
                    <div className="border border-[#e5e7eb] p-4">
                      <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-3">UPLOADED ID SCAN</p>
                      <div className="bg-[#f3f4f6] aspect-[3/2] flex items-center justify-center border border-dashed border-[#d1d5dc]">
                        {selectedVerification.idPhotoUrl ? (
                          <img src={selectedVerification.idPhotoUrl} alt="Student ID" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <span className="font-mono text-[9px] text-[#99a1af]">[ ID IMAGE PREVIEW ]</span>
                        )}
                      </div>
                      <button className="w-full mt-3 h-[32px] border border-black font-mono text-[9px] text-black tracking-[0.5px] hover:bg-black hover:text-white transition-colors">
                        VIEW FULL SIZE
                      </button>
                    </div>

                    {/* Admin Notes */}
                    {selectedVerification.status === "PENDING" && (
                      <div className="border border-[#e5e7eb] p-4">
                        <p className="font-mono text-[8px] text-[#99a1af] tracking-[1.5px] mb-3">ADMIN NOTES</p>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add notes for rejection reason..."
                          className="w-full h-[80px] border border-[#d1d5dc] p-2 font-mono text-[10px] text-black resize-none outline-none focus:border-black"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              {selectedVerification.status === "PENDING" && (
                <div className="h-[60px] shrink-0 border-t border-[#e5e7eb] flex items-center justify-end gap-3 px-6">
                  <button
                    onClick={() => handleReject(selectedVerification.id)}
                    className="h-[38px] px-6 bg-[#ef4444] flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 3L9 9M9 3L3 9" stroke="white" strokeLinecap="round" strokeWidth="1.5" />
                    </svg>
                    <span className="font-mono text-[10px] text-white tracking-[0.5px]">REJECT APPLICATION</span>
                  </button>
                  <button
                    onClick={() => handleApprove(selectedVerification.id)}
                    className="h-[38px] px-6 bg-[#10b981] flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                    <span className="font-mono text-[10px] text-white tracking-[0.5px]">APPROVE & VERIFY</span>
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
          VERIFICATION QUEUE • {pendingCount} PENDING • {processed.length} PROCESSED TODAY
        </span>
        <span className="font-mono text-[8px] text-[#99a1af] tracking-[0.5px]">AUTO-REFRESH: 30s</span>
      </footer>
    </div>
  );
}
