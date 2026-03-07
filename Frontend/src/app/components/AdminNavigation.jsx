import { useNavigate } from "react-router";
import imgLogo from "figma:asset/cf24a05d7bab431c95d30e2583597f4692c35574.png";

export function AdminNavigation({ activePage }) {
  const navigate = useNavigate();

  const navItems = [
    { id: "dashboard", label: "DASHBOARD", icon: DashboardIcon, path: "/admin" },
    { id: "verifications", label: "VERIFICATIONS", icon: VerifyIcon, path: "/admin/verifications", badge: 12 },
    { id: "users", label: "USERS", icon: UsersIcon, path: "/admin/users" },
    { id: "rides", label: "RIDES", icon: RideIcon, path: "/admin/rides" },
    { id: "sos", label: "SOS ALERTS", icon: SOSIcon, path: "/admin/sos", alert: true },
  ];

  return (
    <nav className="bg-white h-[52px] shrink-0 w-full border-b border-black relative z-10">
      <div className="flex items-center justify-between h-full px-4">

        {/* Logo */}
        <button onClick={() => navigate("/admin")} className="h-8 w-[134px] shrink-0 flex items-center gap-2">
          <img src={imgLogo} alt="Uni-Lift" className="h-full w-full object-contain object-left" />
        </button>

        {/* Admin Badge */}
        <div className="bg-black px-2 py-1 ml-2">
          <span className="font-mono text-[8px] text-white tracking-[1px]">ADMIN CONSOLE</span>
        </div>

        {/* Center Nav Tabs */}
        <div className="flex items-end h-full gap-0 ml-auto mr-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`h-full px-4 flex items-center gap-2 border-b-2 transition-colors ${
                  isActive ? "border-black" : "border-transparent"
                }`}
              >
                <Icon active={isActive} />
                <span className={`font-mono text-[9px] tracking-[0.5px] ${isActive ? "text-black" : "text-[#666]"}`}>
                  {item.label}
                </span>
                {item.badge && (
                  <div className="bg-[#f59e0b] px-1.5 py-0.5 ml-1">
                    <span className="font-mono text-[7px] text-white">{item.badge}</span>
                  </div>
                )}
                {item.alert && (
                  <div className="size-2 rounded-full bg-[#ef4444] animate-pulse ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Admin User Badge */}
          <div className="border border-black h-[30px] flex items-center gap-2 px-2">
            <div className="bg-[#ef4444] size-5 flex items-center justify-center">
              <span className="font-mono text-[8px] text-white">AD</span>
            </div>
            <span className="font-mono text-[9px] text-[#0a0a0a] tracking-[0.2px]">ADMIN</span>
          </div>

          {/* Logout */}
          <button
            onClick={() => navigate("/")}
            className="size-[26px] flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M4.08 11.08H1.75C1.44 11.08 1.14 10.96 0.93 10.74C0.71 10.52 0.58 10.23 0.58 9.92V1.75C0.58 1.44 0.71 1.14 0.93 0.93C1.14 0.71 1.44 0.58 1.75 0.58H4.08"
                stroke="#0A0A0A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.17"
              />
              <path d="M0.58 6.42L3.5 3.5L0.58 0.58" stroke="#0A0A0A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.17" transform="translate(6, 3.5)" />
              <path d="M7.58 5.83H0.58" stroke="#0A0A0A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.17" transform="translate(5.5, 1.17)" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function DashboardIcon({ active }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="1" width="4" height="4" stroke={active ? "black" : "#666"} strokeWidth="1" />
      <rect x="7" y="1" width="4" height="4" stroke={active ? "black" : "#666"} strokeWidth="1" />
      <rect x="1" y="7" width="4" height="4" stroke={active ? "black" : "#666"} strokeWidth="1" />
      <rect x="7" y="7" width="4" height="4" stroke={active ? "black" : "#666"} strokeWidth="1" />
    </svg>
  );
}

function VerifyIcon({ active }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M10 3L4.5 8.5L2 6" stroke={active ? "black" : "#666"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}

function UsersIcon({ active }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M8.5 10.5V9.5C8.5 8.95 8.28 8.42 7.89 8.03C7.5 7.64 6.97 7.42 6.42 7.42H3.08C2.53 7.42 2 7.64 1.61 8.03C1.22 8.42 1 8.95 1 9.5V10.5" stroke={active ? "black" : "#666"} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4.75" cy="3.75" r="2" stroke={active ? "black" : "#666"} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 10.5V9.5C11 9.05 10.84 8.62 10.56 8.28C10.28 7.94 9.89 7.72 9.45 7.64" stroke={active ? "black" : "#666"} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 1.64C8.45 1.72 8.84 1.94 9.12 2.28C9.4 2.62 9.56 3.05 9.56 3.5C9.56 3.95 9.4 4.38 9.12 4.72C8.84 5.06 8.45 5.28 8 5.36" stroke={active ? "black" : "#666"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RideIcon({ active }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="3" cy="9" r="1.5" stroke={active ? "black" : "#666"} />
      <circle cx="9" cy="9" r="1.5" stroke={active ? "black" : "#666"} />
      <path d="M4.5 9H7.5M1.5 9H1V6L2 4H5L6 2H9L10.5 6V9H10.5" stroke={active ? "black" : "#666"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SOSIcon({ active }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M10.5 8.5L6.5 1.5C6.35 1.25 6.1 1.1 5.8 1.1C5.5 1.1 5.25 1.25 5.1 1.5L1.1 8.5C0.95 8.75 0.95 9.05 1.1 9.3C1.25 9.55 1.5 9.7 1.8 9.7H9.8C10.1 9.7 10.35 9.55 10.5 9.3C10.65 9.05 10.65 8.75 10.5 8.5Z"
        stroke={active ? "#ef4444" : "#666"}
        fill={active ? "#ef4444" : "none"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5.8 4V5.8" stroke={active ? "white" : "#666"} strokeLinecap="round" strokeWidth="1.2" />
      <path d="M5.8 7.6H5.8" stroke={active ? "white" : "#666"} strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}
