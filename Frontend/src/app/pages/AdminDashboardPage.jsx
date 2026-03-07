import { useState } from "react";
import { useNavigate } from "react-router";
import { AdminNavigation } from "../components/AdminNavigation";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const STATS = {
  totalUsers: 1247,
  activeDrivers: 89,
  activeRiders: 156,
  pendingVerifications: 12,
  ridesInProgress: 23,
  ridesCompleted: 4521,
  sosAlerts: 2,
  avgRating: 4.6,
};

const RECENT_VERIFICATIONS = [
  { id: "1", name: "Juan Dela Cruz", email: "j.delacruz@cit.edu", studentId: "2024-0001", status: "PENDING", date: "2 min ago" },
  { id: "2", name: "Maria Santos", email: "m.santos@cit.edu", studentId: "2024-0015", status: "PENDING", date: "15 min ago" },
  { id: "3", name: "Pedro Reyes", email: "p.reyes@cit.edu", studentId: "2024-0089", status: "PENDING", date: "1 hour ago" },
];

const ACTIVE_RIDES = [
  { id: "R001", driver: "Marcus Rivera", rider: "Anna Lee", route: "Engineering → Main Plaza", status: "IN_TRANSIT", time: "12 min" },
  { id: "R002", driver: "Kyla Santos", rider: "John Smith", route: "Library → Dorm A", status: "IN_TRANSIT", time: "5 min" },
  { id: "R003", driver: "Diego Reyes", rider: "Sarah Chen", route: "Science → SM City", status: "SCHEDULED", time: "—" },
];

const SOS_ALERTS = [
  { id: "S001", user: "Anonymous Rider", type: "SILENT", location: "Near Engineering Gate", time: "3 min ago", status: "ACTIVE" },
  { id: "S002", user: "Maria Lopez", type: "ALARM", location: "Main Road", time: "1 hour ago", status: "RESOLVED" },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color = "bg-black", trend }) {
  return (
    <div className="border border-[#e5e7eb] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] text-[#6a7282] tracking-[1.5px]">{label}</span>
        <div className={`${color} p-1.5`}>{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <span className="font-mono text-[28px] text-black leading-none">{value}</span>
        {trend && (
          <span className={`font-mono text-[9px] ${trend > 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    PENDING: "bg-[#f59e0b]",
    APPROVED: "bg-[#10b981]",
    REJECTED: "bg-[#ef4444]",
    IN_TRANSIT: "bg-[#2563eb]",
    SCHEDULED: "bg-[#6a7282]",
    COMPLETED: "bg-[#10b981]",
    ACTIVE: "bg-[#ef4444] animate-pulse",
    RESOLVED: "bg-[#6a7282]",
  };
  return (
    <div className={`${colors[status] || "bg-black"} px-2 py-0.5`}>
      <span className="font-mono text-[7px] text-white tracking-[0.5px]">{status}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [systemTime] = useState(new Date().toLocaleTimeString());

  return (
    <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
      <AdminNavigation activePage="dashboard" />

      {/* Hero Bar */}
      <div className="bg-black h-[72px] shrink-0 flex items-center justify-between px-6">
        <div>
          <h1 className="font-mono text-[20px] text-white tracking-[0.5px]">ADMIN DASHBOARD</h1>
          <p className="font-mono text-[9px] text-[#d1d5dc] tracking-[2px] mt-0.5">
            Campus Transportation Management System
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-[#10b981]" />
            <span className="font-mono text-[8px] text-[#d1d5dc] tracking-[0.5px]">
              SYSTEM ONLINE • {systemTime}
            </span>
          </div>
          <div className="border border-[#6a7282] px-3 py-1">
            <span className="font-mono text-[8px] text-[#d1d5dc] tracking-[1px]">NODE: ADMIN-01</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            label="TOTAL USERS"
            value={STATS.totalUsers.toLocaleString()}
            icon={<UsersStatIcon />}
            trend={12}
          />
          <StatCard
            label="ACTIVE DRIVERS"
            value={STATS.activeDrivers}
            icon={<DriverStatIcon />}
            color="bg-[#10b981]"
          />
          <StatCard
            label="RIDES IN PROGRESS"
            value={STATS.ridesInProgress}
            icon={<RideStatIcon />}
            color="bg-[#2563eb]"
          />
          <StatCard
            label="PENDING VERIFICATIONS"
            value={STATS.pendingVerifications}
            icon={<VerifyStatIcon />}
            color="bg-[#f59e0b]"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="ACTIVE RIDERS" value={STATS.activeRiders} icon={<RiderStatIcon />} />
          <StatCard label="RIDES COMPLETED" value={STATS.ridesCompleted.toLocaleString()} icon={<CheckStatIcon />} color="bg-[#10b981]" trend={8} />
          <StatCard label="SOS ALERTS" value={STATS.sosAlerts} icon={<SOSStatIcon />} color="bg-[#ef4444]" />
          <StatCard label="AVG RATING" value={STATS.avgRating} icon={<StarStatIcon />} color="bg-[#f59e0b]" />
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-3 gap-6">

          {/* Pending Verifications */}
          <div className="border border-[#e5e7eb]">
            <div className="h-[44px] border-b border-[#e5e7eb] flex items-center justify-between px-4">
              <span className="font-mono text-[9px] text-[#6a7282] tracking-[1.5px]">PENDING VERIFICATIONS</span>
              <button
                onClick={() => navigate("/admin/verifications")}
                className="font-mono text-[8px] text-[#2563eb] tracking-[0.5px] hover:underline"
              >
                VIEW ALL →
              </button>
            </div>
            <div className="divide-y divide-[#f3f4f6]">
              {RECENT_VERIFICATIONS.map((v) => (
                <div key={v.id} className="p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-black">{v.name}</span>
                    <StatusBadge status={v.status} />
                  </div>
                  <p className="font-mono text-[8px] text-[#6a7282]">{v.email}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-[8px] text-[#99a1af]">ID: {v.studentId}</span>
                    <span className="font-mono text-[8px] text-[#99a1af]">{v.date}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-[40px] border-t border-[#e5e7eb] flex items-center justify-center">
              <button
                onClick={() => navigate("/admin/verifications")}
                className="font-mono text-[9px] text-black tracking-[0.5px] hover:underline"
              >
                REVIEW ALL {STATS.pendingVerifications} PENDING →
              </button>
            </div>
          </div>

          {/* Active Rides */}
          <div className="border border-[#e5e7eb]">
            <div className="h-[44px] border-b border-[#e5e7eb] flex items-center justify-between px-4">
              <span className="font-mono text-[9px] text-[#6a7282] tracking-[1.5px]">ACTIVE RIDES</span>
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-[#10b981] animate-pulse" />
                <span className="font-mono text-[8px] text-[#10b981]">{STATS.ridesInProgress} LIVE</span>
              </div>
            </div>
            <div className="divide-y divide-[#f3f4f6]">
              {ACTIVE_RIDES.map((r) => (
                <div key={r.id} className="p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[9px] text-[#6a7282]">{r.id}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="font-mono text-[10px] text-black mb-1">{r.route}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] text-[#6a7282]">
                      {r.driver} → {r.rider}
                    </span>
                    <span className="font-mono text-[8px] text-[#99a1af]">{r.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-[40px] border-t border-[#e5e7eb] flex items-center justify-center">
              <button
                onClick={() => navigate("/admin/rides")}
                className="font-mono text-[9px] text-black tracking-[0.5px] hover:underline"
              >
                VIEW ALL RIDES →
              </button>
            </div>
          </div>

          {/* SOS Alerts */}
          <div className="border border-[#e5e7eb]">
            <div className="h-[44px] border-b border-[#e5e7eb] flex items-center justify-between px-4 bg-[#fef2f2]">
              <span className="font-mono text-[9px] text-[#ef4444] tracking-[1.5px]">⚠ SOS ALERTS</span>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-[#ef4444] animate-pulse" />
                <span className="font-mono text-[8px] text-[#ef4444]">{STATS.sosAlerts} ACTIVE</span>
              </div>
            </div>
            <div className="divide-y divide-[#f3f4f6]">
              {SOS_ALERTS.map((s) => (
                <div key={s.id} className={`p-3 ${s.status === "ACTIVE" ? "bg-[#fef2f2]" : ""} hover:bg-gray-50 transition-colors cursor-pointer`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-[#6a7282]">{s.id}</span>
                      <div className={`px-1.5 py-0.5 ${s.type === "ALARM" ? "bg-[#ef4444]" : "bg-[#f59e0b]"}`}>
                        <span className="font-mono text-[7px] text-white">{s.type}</span>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="font-mono text-[10px] text-black mb-1">{s.user}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] text-[#6a7282]">📍 {s.location}</span>
                    <span className="font-mono text-[8px] text-[#99a1af]">{s.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-[40px] border-t border-[#e5e7eb] flex items-center justify-center">
              <button
                onClick={() => navigate("/admin/sos")}
                className="font-mono text-[9px] text-[#ef4444] tracking-[0.5px] hover:underline"
              >
                VIEW SOS CONSOLE →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <footer className="h-[32px] shrink-0 bg-[#f9f9f9] border-t border-[#e5e7eb] flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-[#10b981]" />
            <span className="font-mono text-[8px] text-[#6a7282] tracking-[0.5px]">API: HEALTHY</span>
          </div>
          <span className="font-mono text-[8px] text-[#99a1af]">|</span>
          <span className="font-mono text-[8px] text-[#6a7282] tracking-[0.5px]">DB: CONNECTED</span>
          <span className="font-mono text-[8px] text-[#99a1af]">|</span>
          <span className="font-mono text-[8px] text-[#6a7282] tracking-[0.5px]">WS: ONLINE</span>
        </div>
        <span className="font-mono text-[8px] text-[#99a1af] tracking-[0.5px]">UNI-LIFT ADMIN v1.0.4 • © 2026</span>
      </footer>
    </div>
  );
}

// ─── Stat Icons ───────────────────────────────────────────────────────────────
function UsersStatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9.5 12V11C9.5 10.47 9.29 9.96 8.91 9.59C8.54 9.21 8.03 9 7.5 9H4.5C3.97 9 3.46 9.21 3.09 9.59C2.71 9.96 2.5 10.47 2.5 11V12" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
      <circle cx="6" cy="5" r="2" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
      <path d="M12.5 12V11C12.5 10.55 12.34 10.11 12.05 9.77C11.76 9.43 11.37 9.2 10.93 9.11" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
      <path d="M9.43 3.11C9.88 3.2 10.28 3.43 10.57 3.77C10.86 4.11 11.02 4.55 11.02 5C11.02 5.45 10.86 5.89 10.57 6.23C10.28 6.57 9.88 6.8 9.43 6.89" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}

function DriverStatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.2" />
      <circle cx="7" cy="5.5" r="1.5" stroke="white" strokeWidth="1" />
      <path d="M4.5 10.5C4.5 9.12 5.62 8 7 8C8.38 8 9.5 9.12 9.5 10.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function RideStatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="4" cy="10" r="1.5" stroke="white" strokeWidth="1.2" />
      <circle cx="10" cy="10" r="1.5" stroke="white" strokeWidth="1.2" />
      <path d="M5.5 10H8.5M2.5 10H2V7L3 5H6L7 3H10L11.5 7V10H11.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}

function VerifyStatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M11 4L5.5 9.5L3 7" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function RiderStatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 11V10C9 9.47 8.79 8.96 8.41 8.59C8.04 8.21 7.53 8 7 8H4C3.47 8 2.96 8.21 2.59 8.59C2.21 8.96 2 9.47 2 10V11" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
      <circle cx="5.5" cy="4.5" r="2" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}

function CheckStatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.2" />
      <path d="M5 7L6.5 8.5L9.5 5.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}

function SOSStatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M11.5 9.5L7.5 2.5C7.35 2.25 7.1 2.1 6.8 2.1C6.5 2.1 6.25 2.25 6.1 2.5L2.1 9.5C1.95 9.75 1.95 10.05 2.1 10.3C2.25 10.55 2.5 10.7 2.8 10.7H10.8C11.1 10.7 11.35 10.55 11.5 10.3C11.65 10.05 11.65 9.75 11.5 9.5Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
      <path d="M6.8 5V6.8" stroke="white" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M6.8 8.6H6.8" stroke="white" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function StarStatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2L8.5 5L12 5.5L9.5 8L10 11.5L7 10L4 11.5L4.5 8L2 5.5L5.5 5L7 2Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}
