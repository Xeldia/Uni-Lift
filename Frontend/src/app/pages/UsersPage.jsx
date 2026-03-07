import { useState } from "react";
import { AdminNavigation } from "../components/AdminNavigation";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: "U001", name: "Marcus Rivera", email: "m.rivera@cit.edu", studentId: "2023-0112", role: "DRIVER", status: "ACTIVE", rating: 4.8, ridesCompleted: 156, vehicle: "Honda Click 150i", joinedAt: "2025-08-15" },
  { id: "U002", name: "Kyla Santos", email: "k.santos@cit.edu", studentId: "2023-0234", role: "DRIVER", status: "ACTIVE", rating: 4.5, ridesCompleted: 89, vehicle: "Toyota Wigo", joinedAt: "2025-09-01" },
  { id: "U003", name: "Diego Reyes", email: "d.reyes@cit.edu", studentId: "2023-0445", role: "DRIVER", status: "ACTIVE", rating: 4.0, ridesCompleted: 234, vehicle: "Yamaha NMAX 155", joinedAt: "2025-07-20" },
  { id: "U004", name: "Anne Cruz", email: "a.cruz@cit.edu", studentId: "2024-0001", role: "RIDER", status: "ACTIVE", rating: 4.9, ridesCompleted: 45, vehicle: null, joinedAt: "2025-10-10" },
  { id: "U005", name: "John Smith", email: "j.smith@cit.edu", studentId: "2024-0089", role: "RIDER", status: "ACTIVE", rating: 4.3, ridesCompleted: 23, vehicle: null, joinedAt: "2025-11-05" },
  { id: "U006", name: "Sarah Chen", email: "s.chen@usc.edu.ph", studentId: "2024-1234", role: "RIDER", status: "SUSPENDED", rating: 2.1, ridesCompleted: 12, vehicle: null, joinedAt: "2025-12-01", suspendReason: "Multiple ride cancellations" },
  { id: "U007", name: "Leo Martinez", email: "l.martinez@cit.edu", studentId: "2023-0891", role: "DRIVER", status: "ACTIVE", rating: 4.7, ridesCompleted: 178, vehicle: "Honda XRM Sidecar", joinedAt: "2025-06-15" },
  { id: "U008", name: "Emma Wilson", email: "e.wilson@cit.edu", studentId: "2023-0445", role: "RIDER", status: "PENDING", rating: 0, ridesCompleted: 0, vehicle: null, joinedAt: "2026-03-07" },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    ACTIVE: "bg-[#10b981]",
    SUSPENDED: "bg-[#ef4444]",
    PENDING: "bg-[#f59e0b]",
    INACTIVE: "bg-[#6a7282]",
  };
  return (
    <div className={`${colors[status] || "bg-black"} px-2 py-0.5 inline-flex`}>
      <span className="font-mono text-[7px] text-white tracking-[0.5px]">{status}</span>
    </div>
  );
}

function RoleBadge({ role }) {
  const colors = {
    DRIVER: "border-[#2563eb] text-[#2563eb]",
    RIDER: "border-[#6a7282] text-[#6a7282]",
  };
  return (
    <div className={`border px-2 py-0.5 inline-flex ${colors[role] || "border-black text-black"}`}>
      <span className="font-mono text-[7px] tracking-[0.5px]">{role}</span>
    </div>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 1L6.1 3.3L8.6 3.6L6.8 5.3L7.3 7.8L5 6.5L2.7 7.8L3.2 5.3L1.4 3.6L3.9 3.3L5 1Z" fill="#f59e0b" />
      </svg>
      <span className="font-mono text-[9px] text-black">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────
function UserRow({ user, isSelected, onSelect }) {
  return (
    <tr
      className={`border-b border-[#f3f4f6] hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? "bg-[#f9f9f9]" : ""}`}
      onClick={onSelect}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="bg-black size-8 flex items-center justify-center shrink-0">
            <span className="font-mono text-[9px] text-white">
              {user.name.split(" ").map(n => n[0]).join("")}
            </span>
          </div>
          <div>
            <p className="font-mono text-[10px] text-black">{user.name}</p>
            <p className="font-mono text-[8px] text-[#6a7282]">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-[9px] text-[#6a7282]">{user.studentId}</span>
      </td>
      <td className="py-3 px-4">
        <RoleBadge role={user.role} />
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={user.status} />
      </td>
      <td className="py-3 px-4">
        {user.rating > 0 ? <StarRating rating={user.rating} /> : <span className="font-mono text-[8px] text-[#99a1af]">—</span>}
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-[9px] text-[#6a7282]">{user.ridesCompleted}</span>
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-[8px] text-[#99a1af]">{user.joinedAt}</span>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function UsersPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const selectedUser = users.find(u => u.id === selectedId);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.studentId.includes(searchQuery);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSuspend = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "SUSPENDED" } : u));
  };

  const handleActivate = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "ACTIVE" } : u));
  };

  const stats = {
    total: users.length,
    drivers: users.filter(u => u.role === "DRIVER").length,
    riders: users.filter(u => u.role === "RIDER").length,
    active: users.filter(u => u.status === "ACTIVE").length,
    suspended: users.filter(u => u.status === "SUSPENDED").length,
  };

  return (
    <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
      <AdminNavigation activePage="users" />

      {/* Hero Bar */}
      <div className="bg-black h-[72px] shrink-0 flex items-center justify-between px-6">
        <div>
          <h1 className="font-mono text-[20px] text-white tracking-[0.5px]">USER MANAGEMENT</h1>
          <p className="font-mono text-[9px] text-[#d1d5dc] tracking-[2px] mt-0.5">
            Manage students, drivers, and riders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="border border-[#6a7282] px-3 py-1 flex items-center gap-2">
            <span className="font-mono text-[9px] text-[#d1d5dc]">TOTAL: {stats.total}</span>
          </div>
          <div className="border border-[#10b981] px-3 py-1 flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-[#10b981]" />
            <span className="font-mono text-[9px] text-[#10b981]">{stats.active} ACTIVE</span>
          </div>
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
              <div className="w-[280px] h-[32px] border border-[#d1d5dc] flex items-center px-3 gap-2">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M5 9C7.21 9 9 7.21 9 5C9 2.79 7.21 1 5 1C2.79 1 1 2.79 1 5C1 7.21 2.79 9 5 9Z" stroke="#99a1af" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11 11L8 8" stroke="#99a1af" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or ID..."
                  className="flex-1 font-mono text-[9px] text-black bg-transparent outline-none placeholder:text-[#d1d5dc]"
                />
              </div>

              {/* Role Filter */}
              <div className="flex items-center border border-[#d1d5dc] h-[32px]">
                {["ALL", "DRIVER", "RIDER"].map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`h-full px-3 font-mono text-[8px] tracking-[0.5px] transition-colors ${
                      roleFilter === role ? "bg-black text-white" : "text-[#6a7282] hover:bg-gray-50"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center border border-[#d1d5dc] h-[32px]">
                {["ALL", "ACTIVE", "SUSPENDED", "PENDING"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`h-full px-3 font-mono text-[8px] tracking-[0.5px] transition-colors ${
                      statusFilter === status ? "bg-black text-white" : "text-[#6a7282] hover:bg-gray-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-[#99a1af]">{filteredUsers.length} RESULTS</span>
              <button className="h-[32px] px-4 bg-black font-mono text-[9px] text-white tracking-[0.5px] hover:bg-gray-900 transition-colors">
                EXPORT CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-[#f9f9f9] sticky top-0">
                <tr className="border-b border-[#e5e7eb]">
                  <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">USER</th>
                  <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">STUDENT ID</th>
                  <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">ROLE</th>
                  <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">STATUS</th>
                  <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">RATING</th>
                  <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">RIDES</th>
                  <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">JOINED</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isSelected={selectedId === user.id}
                    onSelect={() => setSelectedId(user.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </main>

        {/* Right Detail Panel */}
        {selectedUser && (
          <aside className="w-[320px] shrink-0 border-l border-[#e5e7eb] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-[80px] shrink-0 border-b border-[#e5e7eb] flex items-center px-4 gap-4">
              <div className="bg-black size-14 flex items-center justify-center">
                <span className="font-mono text-[16px] text-white">
                  {selectedUser.name.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <div>
                <p className="font-mono text-[12px] text-black">{selectedUser.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <RoleBadge role={selectedUser.role} />
                  <StatusBadge status={selectedUser.status} />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Contact Info */}
              <div className="border border-[#e5e7eb] p-3">
                <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-2">CONTACT</p>
                <div className="space-y-2">
                  <div>
                    <p className="font-mono text-[7px] text-[#99a1af]">EMAIL</p>
                    <p className="font-mono text-[9px] text-black">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[7px] text-[#99a1af]">STUDENT ID</p>
                    <p className="font-mono text-[9px] text-black">{selectedUser.studentId}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="border border-[#e5e7eb] p-3">
                <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-2">STATISTICS</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-mono text-[7px] text-[#99a1af]">RATING</p>
                    {selectedUser.rating > 0 ? (
                      <StarRating rating={selectedUser.rating} />
                    ) : (
                      <span className="font-mono text-[9px] text-[#99a1af]">No ratings yet</span>
                    )}
                  </div>
                  <div>
                    <p className="font-mono text-[7px] text-[#99a1af]">RIDES COMPLETED</p>
                    <p className="font-mono text-[14px] text-black">{selectedUser.ridesCompleted}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[7px] text-[#99a1af]">JOINED</p>
                    <p className="font-mono text-[9px] text-[#6a7282]">{selectedUser.joinedAt}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[7px] text-[#99a1af]">USER ID</p>
                    <p className="font-mono text-[9px] text-[#6a7282]">{selectedUser.id}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle (for drivers) */}
              {selectedUser.vehicle && (
                <div className="border border-[#e5e7eb] p-3">
                  <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-2">VEHICLE</p>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#2563eb] size-8 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="4" cy="10" r="1.5" stroke="white" strokeWidth="1" />
                        <circle cx="10" cy="10" r="1.5" stroke="white" strokeWidth="1" />
                        <path d="M5.5 10H8.5M2.5 10H2V7L3 5H6L7 3H10L11.5 7V10" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="font-mono text-[10px] text-black">{selectedUser.vehicle}</span>
                  </div>
                </div>
              )}

              {/* Suspension Reason */}
              {selectedUser.suspendReason && (
                <div className="border border-[#ef4444] p-3 bg-[#fef2f2]">
                  <p className="font-mono text-[7px] text-[#ef4444] tracking-[1.5px] mb-2">SUSPENSION REASON</p>
                  <p className="font-mono text-[9px] text-[#ef4444]">{selectedUser.suspendReason}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="h-[60px] shrink-0 border-t border-[#e5e7eb] flex items-center justify-between px-4">
              <button className="h-[32px] px-4 border border-black font-mono text-[8px] text-black tracking-[0.5px] hover:bg-black hover:text-white transition-colors">
                VIEW HISTORY
              </button>
              {selectedUser.status === "ACTIVE" ? (
                <button
                  onClick={() => handleSuspend(selectedUser.id)}
                  className="h-[32px] px-4 bg-[#ef4444] font-mono text-[8px] text-white tracking-[0.5px] hover:bg-red-600 transition-colors"
                >
                  SUSPEND USER
                </button>
              ) : selectedUser.status === "SUSPENDED" ? (
                <button
                  onClick={() => handleActivate(selectedUser.id)}
                  className="h-[32px] px-4 bg-[#10b981] font-mono text-[8px] text-white tracking-[0.5px] hover:bg-green-600 transition-colors"
                >
                  REACTIVATE
                </button>
              ) : null}
            </div>
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer className="h-[32px] shrink-0 bg-[#f9f9f9] border-t border-[#e5e7eb] flex items-center px-6 justify-between">
        <span className="font-mono text-[8px] text-[#6a7282] tracking-[0.5px]">
          USERS: {stats.total} • DRIVERS: {stats.drivers} • RIDERS: {stats.riders}
        </span>
        <span className="font-mono text-[8px] text-[#99a1af] tracking-[0.5px]">LAST UPDATED: JUST NOW</span>
      </footer>
    </div>
  );
}
