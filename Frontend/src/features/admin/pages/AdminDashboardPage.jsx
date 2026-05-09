import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AdminNavigation } from "../components/AdminNavigation";
import { getAdminStats } from "../../../shared/lib/supabase";

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color = "bg-black" }) {
  return (
    <div className="border border-[#e5e7eb] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] text-[#6a7282] tracking-[1.5px]">{label}</span>
        <div className={`${color} p-1.5`}>{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <span className="font-mono text-[28px] text-black leading-none">{value}</span>
      </div>
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    PENDING:   "bg-[#f59e0b]",
    APPROVED:  "bg-[#10b981]",
    REJECTED:  "bg-[#ef4444]",
    IN_TRANSIT:"bg-[#2563eb]",
    COMPLETED: "bg-[#10b981]",
    ACTIVE:    "bg-[#ef4444] animate-pulse",
    RESOLVED:  "bg-[#6a7282]",
  };
  return (
    <div className={`${colors[status] || "bg-black"} px-2 py-0.5`}>
      <span className="font-mono text-[7px] text-white tracking-[0.5px]">{status}</span>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Live clock
  useEffect(() => {
    const tick = setInterval(() => setSystemTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Live stats — fetch on mount and refresh every 30s
  const fetchStats = async () => {
    setLoadingStats(true);
    const data = await getAdminStats();
    setStats(data);
    setLoadingStats(false);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, []);

  const stat = (key, fallback = 0) =>
    loadingStats ? "—" : (stats?.[key] ?? fallback);

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
              SYSTEM ONLINE &bull; {systemTime}
            </span>
          </div>
          <div className="border border-[#6a7282] px-3 py-1">
            <span className="font-mono text-[8px] text-[#d1d5dc] tracking-[1px]">NODE: ADMIN-01</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-6">

        {/* Stats Grid — Primary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            label="TOTAL USERS"
            value={loadingStats ? "—" : (stats?.totalUsers ?? 0).toLocaleString()}
            icon={<UsersStatIcon />}
          />
          <StatCard
            label="ACTIVE DRIVERS"
            value={stat("totalDrivers")}
            icon={<DriverStatIcon />}
            color="bg-[#10b981]"
          />
          <StatCard
            label="RIDES IN PROGRESS"
            value={stat("ridesInProgress")}
            icon={<RideStatIcon />}
            color="bg-[#2563eb]"
          />
          <StatCard
            label="PENDING VERIFICATIONS"
            value={stat("pendingVerifications")}
            icon={<VerifyStatIcon />}
            color="bg-[#f59e0b]"
          />
        </div>

        {/* Stats Grid — Secondary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="TOTAL RIDERS"    value={stat("totalRiders")}    icon={<RiderStatIcon />} />
          <StatCard label="RIDES COMPLETED" value={loadingStats ? "—" : (stats?.ridesCompleted ?? 0).toLocaleString()} icon={<CheckStatIcon />} color="bg-[#10b981]" />
          <StatCard label="ACTIVE SOS"      value={stat("activeSOS")}      icon={<SOSStatIcon />}   color="bg-[#ef4444]" />
          <StatCard label="TODAY REVENUE"   value={loadingStats ? "—" : `\u20b1${(stats?.revenueToday ?? 0).toLocaleString()}`} icon={<StarStatIcon />} color="bg-[#f59e0b]" />
        </div>

        {/* Three-column nav cards */}
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              title: "PENDING VERIFICATIONS",
              sub: "Review and approve student registrations",
              href: "/admin/verifications",
              count: stats?.pendingVerifications,
              label: "PENDING",
              color: "text-[#f59e0b]",
            },
            {
              title: "ACTIVE RIDES",
              sub: "Monitor live rides and force-end if needed",
              href: "/admin/rides",
              count: stats?.ridesInProgress,
              label: "IN PROGRESS",
              color: "text-[#2563eb]",
            },
            {
              title: "SOS ALERTS",
              sub: "Respond to active safety alerts",
              href: "/admin/sos",
              count: stats?.activeSOS,
              label: "ACTIVE",
              color: "text-[#ef4444]",
            },
          ].map((card) => (
            <div key={card.title} className="border border-[#e5e7eb]">
              <div className="h-[44px] border-b border-[#e5e7eb] flex items-center justify-between px-4">
                <span className="font-mono text-[9px] text-[#6a7282] tracking-[1.5px]">{card.title}</span>
                <button
                  onClick={() => navigate(card.href)}
                  className="font-mono text-[8px] text-[#2563eb] tracking-[0.5px] hover:underline"
                >
                  VIEW ALL
                </button>
              </div>
              <div className="p-6 flex flex-col items-center justify-center gap-3">
                {!loadingStats && card.count > 0 ? (
                  <>
                    <span className={`font-mono text-[40px] ${card.color} leading-none`}>{card.count}</span>
                    <span className="font-mono text-[9px] text-[#99a1af] tracking-[1px]">{card.label}</span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-[40px] text-[#d1d5dc] leading-none">
                      {loadingStats ? "—" : "0"}
                    </span>
                    <span className="font-mono text-[9px] text-[#99a1af] tracking-[1px]">
                      {loadingStats ? "LOADING" : "ALL CLEAR"}
                    </span>
                  </>
                )}
                <p className="font-mono text-[8px] text-[#6a7282] text-center mt-1">{card.sub}</p>
              </div>
              <div className="h-[40px] border-t border-[#e5e7eb] flex items-center justify-center">
                <button
                  onClick={() => navigate(card.href)}
                  className="font-mono text-[9px] text-black tracking-[0.5px] hover:underline"
                >
                  OPEN {card.title}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Footer */}
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
        <span className="font-mono text-[8px] text-[#99a1af] tracking-[0.5px]">UNI-LIFT ADMIN v1.0.4</span>
      </footer>
    </div>
  );
}

// ── Stat Icons ────────────────────────────────────────────────────────────────
function UsersStatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9.5 12V11C9.5 10.47 9.29 9.96 8.91 9.59C8.54 9.21 8.03 9 7.5 9H4.5C3.97 9 3.46 9.21 3.09 9.59C2.71 9.96 2.5 10.47 2.5 11V12" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
      <circle cx="6" cy="5" r="2" stroke="white" strokeWidth="1.2" />
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
      <circle cx="5.5" cy="4.5" r="2" stroke="white" strokeWidth="1.2" />
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
      <path d="M7 2L1.5 11.5H12.5L7 2Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
      <path d="M7 6V8.5M7 10V10.5" stroke="white" strokeLinecap="round" strokeWidth="1.2" />
    </svg>
  );
}

function StarStatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5L8.5 5H12L9 7.5L10 11L7 9L4 11L5 7.5L2 5H5.5L7 1.5Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}
