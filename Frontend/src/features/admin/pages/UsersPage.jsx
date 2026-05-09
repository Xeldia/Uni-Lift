import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AdminNavigation } from "../components/AdminNavigation";
import {
  getUsersForAdmin,
  suspendUser,
  reactivateUser,
  revokeDriverPermission,
  setUserRoleForAdmin,
  deleteUser,
  supabase,
} from "../../../shared/lib/supabase";

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    ACTIVE:    "bg-[#10b981]",
    SUSPENDED: "bg-[#ef4444]",
    PENDING:   "bg-[#f59e0b]",
    INACTIVE:  "bg-[#6a7282]",
  };
  return (
    <div className={`${colors[status] || "bg-black"} px-2 py-0.5 inline-flex`}>
      <span className="font-mono text-[7px] text-white tracking-[0.5px]">{status}</span>
    </div>
  );
}

function RoleBadge({ role }) {
  const normalizedRole = (role ?? "RIDER").toUpperCase();
  const colors = {
    DRIVER: "border-[#2563eb] text-[#2563eb]",
    RIDER:  "border-[#6a7282] text-[#6a7282]",
    ADMIN:  "border-[#7c3aed] text-[#7c3aed]",
    BOTH:   "border-[#059669] text-[#059669]",
  };
  return (
    <div className={`border px-2 py-0.5 inline-flex ${colors[normalizedRole] || "border-black text-black"}`}>
      <span className="font-mono text-[7px] tracking-[0.5px]">{normalizedRole}</span>
    </div>
  );
}

function StarRating({ rating }) {
  if (!rating) return <span className="font-mono text-[9px] text-[#99a1af]">—</span>;
  return (
    <div className="flex items-center gap-1">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 1L6.1 3.3L8.6 3.6L6.8 5.3L7.3 7.8L5 6.5L2.7 7.8L3.2 5.3L1.4 3.6L3.9 3.3L5 1Z" fill="#f59e0b" />
      </svg>
      <span className="font-mono text-[9px] text-black">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────
function UserRow({ user, isSelected, onSelect }) {
  const initials = (user.full_name ?? "?")
    .split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
  const status = user.account_status ?? "ACTIVE";

  return (
    <tr
      className={`border-b border-[#f3f4f6] hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? "bg-[#f9f9f9]" : ""}`}
      onClick={onSelect}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="bg-black size-7 flex items-center justify-center shrink-0">
            <span className="font-mono text-[8px] text-white">{initials}</span>
          </div>
          <div>
            <p className="font-mono text-[9px] text-black">{user.full_name}</p>
            <p className="font-mono text-[8px] text-[#6a7282]">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <RoleBadge role={user.role} />
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={status} />
      </td>
      <td className="py-3 px-4">
        <StarRating rating={user.rating} />
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-[9px] text-black">{user.rides_completed}</span>
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-[8px] text-[#99a1af]">
          {new Date(user.created_at).toLocaleDateString()}
        </span>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter]   = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("24");
  const [customSuspendHours, setCustomSuspendHours] = useState("24");
  const [roleDraft, setRoleDraft] = useState("RIDER");
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [currentAdminId, setCurrentAdminId] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentAdminId(data.user.id);
    });
  }, []);

  // ── Fetch real users from Supabase ────────────────────────────────────────
  const fetchUsers = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await getUsersForAdmin();
      setUsers(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load users.";
      console.error("[admin-users]", message);
      setLoadError(message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const selectedUser = users.find((u) => u.id === selectedId);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const normalizedRole = (u.role ?? "RIDER").toUpperCase();
    const matchSearch =
      !q ||
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.student_id ?? "").toLowerCase().includes(q);

    const matchRole =
      roleFilter === "ALL" ||
      (roleFilter === "DRIVER" && normalizedRole === "DRIVER") ||
      (roleFilter === "RIDER"  && normalizedRole === "RIDER") ||
      (roleFilter === "ADMIN"  && normalizedRole === "ADMIN");

    const status = u.account_status ?? "ACTIVE";
    const matchStatus = statusFilter === "ALL" || status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  // ── Suspend ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedUser) return;
    setRoleDraft((selectedUser.role ?? "RIDER").toUpperCase());
  }, [selectedUser?.id]);

  const handleSuspend = async (userId) => {
    const durationHours =
      suspendDuration === "CUSTOM"
        ? Math.max(1, Number(customSuspendHours || 0))
        : Number(suspendDuration);
    setActionLoading(true);
    const { error } = await suspendUser(userId, suspendReason, durationHours);
    if (error) {
      console.error("[suspend]", error.message);
    } else {
      setSuspendReason("");
      setSuspendDuration("24");
      setCustomSuspendHours("24");
      await fetchUsers();
    }
    setActionLoading(false);
  };

  // ── Reactivate ────────────────────────────────────────────────────────────
  const handleReactivate = async (userId) => {
    setActionLoading(true);
    const { error } = await reactivateUser(userId);
    if (error) {
      console.error("[reactivate]", error.message);
    } else {
      await fetchUsers();
    }
    setActionLoading(false);
  };

  const handleRevokeDriver = async (userId) => {
    setActionLoading(true);
    const { error } = await revokeDriverPermission(userId, "Driver permission revoked by admin");
    if (error) {
      console.error("[revoke-driver]", error.message);
    } else {
      await fetchUsers();
    }
    setActionLoading(false);
  };

  const handleRoleChange = async (userId) => {
    setActionLoading(true);
    const { error } = await setUserRoleForAdmin(userId, roleDraft);
    if (error) {
      console.error("[role-change]", error.message);
    } else {
      await fetchUsers();
    }
    setActionLoading(false);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Permanently delete this user? This action cannot be undone.")) return;
    setActionLoading(true);
    const { error } = await deleteUser(userId);
    if (error) {
      console.error("[delete-user]", error.message);
    } else {
      setSelectedId(null);
      await fetchUsers();
    }
    setActionLoading(false);
  };

  const stats = {
    total:     users.length,
    drivers:   users.filter((u) => (u.role ?? "").toUpperCase() === "DRIVER").length,
    riders:    users.filter((u) => (u.role ?? "RIDER").toUpperCase() === "RIDER").length,
    admins:    users.filter((u) => (u.role ?? "").toUpperCase() === "ADMIN").length,
    suspended: users.filter((u) => (u.account_status ?? "ACTIVE") === "SUSPENDED").length,
  };

  const exportCsv = () => {
    const rows = filteredUsers.map((u) => ({
      id: u.id,
      full_name: u.full_name ?? "",
      email: u.email ?? "",
      role: u.role ?? "RIDER",
      account_status: u.account_status ?? "ACTIVE",
      rides_completed: u.rides_completed ?? 0,
      rating: u.rating ?? "",
      student_id: u.student_id ?? "",
      phone_number: u.phone_number ?? "",
      university: u.university ?? "",
      created_at: u.created_at ?? "",
    }));
    const headers = Object.keys(rows[0] ?? {
      id: "", full_name: "", email: "", role: "", account_status: "", rides_completed: "",
      rating: "", student_id: "", phone_number: "", university: "", created_at: "",
    });
    const esc = (v) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`;
    const content = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
      <AdminNavigation activePage="users" />

      {/* Hero Bar */}
      <div className="bg-black h-[72px] shrink-0 flex items-center justify-between px-6">
        <div>
          <h1 className="font-mono text-[20px] text-white tracking-[0.5px]">USER MANAGEMENT</h1>
          <p className="font-mono text-[9px] text-[#d1d5dc] tracking-[2px] mt-0.5">
            {loading ? "Loading..." : `${stats.total} registered users · ${stats.drivers} drivers · ${stats.riders} riders · ${stats.admins} admins`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats.suspended > 0 && (
            <div className="border border-[#ef4444] px-3 py-1">
              <span className="font-mono text-[9px] text-[#ef4444]">{stats.suspended} SUSPENDED</span>
            </div>
          )}
          <button
            onClick={exportCsv}
            className="border border-white/40 px-3 py-1 hover:border-white transition-colors"
          >
            <span className="font-mono text-[9px] text-white tracking-[0.5px]">EXPORT CSV</span>
          </button>
          <button
            onClick={fetchUsers}
            className="border border-white/40 px-3 py-1 hover:border-white transition-colors"
          >
            <span className="font-mono text-[9px] text-white tracking-[0.5px]">↻ REFRESH</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Main Table Area */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Search & Filter Bar */}
          <div className="h-[52px] shrink-0 border-b border-[#e5e7eb] flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="w-[260px] h-[32px] border border-[#d1d5dc] flex items-center px-3 gap-2">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M5 9C7.21 9 9 7.21 9 5C9 2.79 7.21 1 5 1C2.79 1 1 2.79 1 5C1 7.21 2.79 9 5 9Z" stroke="#99a1af" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11 11L8 8" stroke="#99a1af" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, email, student ID..."
                  className="flex-1 font-mono text-[9px] text-black bg-transparent outline-none placeholder:text-[#d1d5dc]"
                />
              </div>

              {/* Role filter */}
              <div className="flex items-center border border-[#d1d5dc] h-[32px]">
                {["ALL", "DRIVER", "RIDER", "ADMIN"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`h-full px-3 font-mono text-[8px] tracking-[0.5px] transition-colors ${roleFilter === r ? "bg-black text-white" : "text-[#6a7282] hover:bg-gray-50"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Status filter */}
              <div className="flex items-center border border-[#d1d5dc] h-[32px]">
                {["ALL", "ACTIVE", "SUSPENDED", "PENDING"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`h-full px-3 font-mono text-[8px] tracking-[0.5px] transition-colors ${statusFilter === s ? "bg-black text-white" : "text-[#6a7282] hover:bg-gray-50"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <span className="font-mono text-[8px] text-[#99a1af]">
              {filteredUsers.length} USERS
            </span>
          </div>

          {loadError && (
            <div className="m-4 border border-[#ef4444] bg-[#fef2f2] p-4">
              <p className="font-mono text-[10px] text-[#991b1b] mb-2">ADMIN API UNREACHABLE</p>
              <p className="font-mono text-[9px] text-[#7f1d1d] leading-4">{loadError}</p>
              <button
                onClick={fetchUsers}
                className="mt-3 h-[30px] px-3 bg-[#ef4444] font-mono text-[8px] text-white tracking-[0.5px]"
              >
                RETRY
              </button>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <p className="font-mono text-[10px] text-[#99a1af] animate-pulse">LOADING USERS...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#f9f9f9] sticky top-0">
                  <tr className="border-b border-[#e5e7eb]">
                    <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">USER</th>
                    <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">ROLE</th>
                    <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">STATUS</th>
                    <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">RATING</th>
                    <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">RIDES</th>
                    <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">JOINED</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <p className="font-mono text-[10px] text-[#99a1af]">NO USERS FOUND</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        isSelected={selectedId === user.id}
                        onSelect={() => setSelectedId(user.id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </main>

        {/* Right Detail Panel */}
        {selectedUser && (
          <aside className="w-[340px] shrink-0 border-l border-[#e5e7eb] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-[80px] shrink-0 border-b border-[#e5e7eb] flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="bg-black size-10 flex items-center justify-center">
                  <span className="font-mono text-[12px] text-white">
                    {(selectedUser.full_name ?? "?").split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-mono text-[13px] text-black">{selectedUser.full_name}</p>
                  <RoleBadge role={selectedUser.role} />
                </div>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-100 rounded">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M9 3L3 9M3 3L9 9" stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Contact info */}
              <div className="border border-[#e5e7eb] p-3 space-y-2">
                <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px]">CONTACT</p>
                <div>
                  <p className="font-mono text-[7px] text-[#99a1af]">EMAIL</p>
                  <p className="font-mono text-[9px] text-black break-all">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="font-mono text-[7px] text-[#99a1af]">PHONE</p>
                  <p className="font-mono text-[9px] text-black">{selectedUser.phone_number ?? "—"}</p>
                </div>
                <div>
                  <p className="font-mono text-[7px] text-[#99a1af]">STUDENT ID</p>
                  <p className="font-mono text-[9px] text-black">{selectedUser.student_id ?? "—"}</p>
                </div>
                <div>
                  <p className="font-mono text-[7px] text-[#99a1af]">UNIVERSITY</p>
                  <p className="font-mono text-[9px] text-black">{selectedUser.university ?? "—"}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-[#e5e7eb] p-3">
                  <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">RIDES</p>
                  <p className="font-mono text-[20px] text-black">{selectedUser.rides_completed}</p>
                </div>
                <div className="border border-[#e5e7eb] p-3">
                  <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">RATING</p>
                  <p className="font-mono text-[20px] text-black">{selectedUser.rating ? Number(selectedUser.rating).toFixed(1) : "—"}</p>
                </div>
              </div>

              {/* Vehicle (drivers only) */}
              {(selectedUser.role ?? "").toUpperCase() === "DRIVER" && (
                <div className="border border-[#e5e7eb] p-3">
                  <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-2">VEHICLE</p>
                  <p className="font-mono text-[10px] text-black">{selectedUser.vehicle ?? selectedUser.vehicle_type ?? "—"}</p>
                  <p className="font-mono text-[8px] text-[#6a7282] mt-1">Status: {selectedUser.driver_status ?? "OFFLINE"}</p>
                </div>
              )}

              {/* Account status */}
              <div className="border border-[#e5e7eb] p-3">
                <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-2">ACCOUNT STATUS</p>
                <StatusBadge status={selectedUser.account_status ?? "ACTIVE"} />
                {selectedUser.account_status === "SUSPENDED" && (
                  <div className="mt-2 p-2 bg-[#fef2f2] border border-[#ef4444]">
                    <p className="font-mono text-[7px] text-[#ef4444] tracking-[1px] mb-1">SUSPEND REASON</p>
                    <p className="font-mono text-[9px] text-[#991b1b]">{selectedUser.suspend_reason ?? "—"}</p>
                    {selectedUser.suspended_at && (
                      <p className="font-mono text-[7px] text-[#99a1af] mt-1">
                        Suspended at: {new Date(selectedUser.suspended_at).toLocaleString()}
                      </p>
                    )}
                    {selectedUser.suspended_until && (
                      <p className="font-mono text-[7px] text-[#99a1af] mt-1">
                        Expires: {new Date(selectedUser.suspended_until).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Role management */}
              <div className="border border-[#e5e7eb] p-3">
                <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-2">ROLE MANAGEMENT</p>
                <div className="flex items-center gap-2">
                  <select
                    value={roleDraft}
                    onChange={(e) => setRoleDraft(e.target.value)}
                    className="flex-1 border border-[#d1d5dc] h-[34px] px-2 font-mono text-[9px] text-black outline-none"
                  >
                    <option value="RIDER">RIDER</option>
                    <option value="DRIVER">DRIVER</option>
                    <option value="BOTH">BOTH</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <button
                    onClick={() => handleRoleChange(selectedUser.id)}
                    disabled={actionLoading || roleDraft === (selectedUser.role ?? "RIDER").toUpperCase() || selectedUser.id === currentAdminId}
                    className="h-[34px] px-3 border border-black font-mono text-[8px] text-black tracking-[0.5px] hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                  >
                    {selectedUser.id === currentAdminId ? "CANNOT EDIT SELF" : "APPLY ROLE"}
                  </button>
                </div>
              </div>

              {/* Suspend reason input — shown when user is ACTIVE */}
              {(selectedUser.account_status ?? "ACTIVE") === "ACTIVE" && (
                <div className="border border-[#e5e7eb] p-3">
                  <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-2">SUSPENSION REASON</p>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Enter reason for suspension..."
                    rows={3}
                    className="w-full border border-[#d1d5dc] p-2 font-mono text-[9px] text-black resize-none outline-none focus:border-black placeholder:text-[#d1d5dc]"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <select
                      value={suspendDuration}
                      onChange={(e) => setSuspendDuration(e.target.value)}
                      className="border border-[#d1d5dc] h-[32px] px-2 font-mono text-[8px] text-black outline-none"
                    >
                      <option value="1">1 hour</option>
                      <option value="6">6 hours</option>
                      <option value="24">24 hours</option>
                      <option value="72">3 days</option>
                      <option value="168">7 days</option>
                      <option value="CUSTOM">Custom (hours)</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={customSuspendHours}
                      onChange={(e) => setCustomSuspendHours(e.target.value)}
                      disabled={suspendDuration !== "CUSTOM"}
                      className="border border-[#d1d5dc] h-[32px] px-2 font-mono text-[8px] text-black outline-none disabled:bg-[#f3f4f6]"
                      placeholder="hours"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="h-[60px] shrink-0 border-t border-[#e5e7eb] flex items-center justify-between px-4 gap-2">
              <button
                onClick={() => navigate("/history")}
                className="h-[36px] px-3 border border-[#d1d5dc] font-mono text-[8px] text-[#6a7282] tracking-[0.5px] hover:border-black hover:text-black transition-colors"
              >
                VIEW HISTORY
              </button>
              {(selectedUser.role ?? "").toUpperCase() === "DRIVER" && (
                <button
                  onClick={() => handleRevokeDriver(selectedUser.id)}
                  disabled={actionLoading}
                  className="h-[36px] px-3 border border-[#ef4444] font-mono text-[8px] text-[#ef4444] tracking-[0.5px] hover:bg-[#ef4444] hover:text-white transition-colors disabled:opacity-50"
                >
                  REVOKE DRIVER
                </button>
              )}
              {(selectedUser.account_status ?? "ACTIVE") === "SUSPENDED" ? (
                <button
                  onClick={() => handleReactivate(selectedUser.id)}
                  disabled={actionLoading}
                  className="flex-1 h-[36px] bg-[#10b981] font-mono text-[9px] text-white tracking-[0.5px] hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "UPDATING..." : "CANCEL SUSPENSION"}
                </button>
              ) : (
                <button
                  onClick={() => handleSuspend(selectedUser.id)}
                  disabled={actionLoading}
                  className="flex-1 h-[36px] bg-[#ef4444] font-mono text-[9px] text-white tracking-[0.5px] hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "UPDATING..." : "SUSPEND USER"}
                </button>
              )}
              <button
                onClick={() => handleDeleteUser(selectedUser.id)}
                disabled={actionLoading || selectedUser.id === currentAdminId}
                className="h-[36px] px-3 border border-black font-mono text-[8px] text-black tracking-[0.5px] hover:bg-black hover:text-white transition-colors disabled:opacity-50"
              >
                DELETE
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer className="h-[32px] shrink-0 bg-[#f9f9f9] border-t border-[#e5e7eb] flex items-center px-6 justify-between">
        <span className="font-mono text-[8px] text-[#6a7282] tracking-[0.5px]">
          {loading ? "LOADING..." : `TOTAL: ${stats.total} · DRIVERS: ${stats.drivers} · RIDERS: ${stats.riders} · SUSPENDED: ${stats.suspended}`}
        </span>
        <span className="font-mono text-[8px] text-[#99a1af] tracking-[0.5px]">LIVE · SUPABASE</span>
      </footer>
    </div>
  );
}
