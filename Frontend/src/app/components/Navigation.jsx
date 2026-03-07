import { useNavigate } from "react-router";
import imgLogo from "figma:asset/cf24a05d7bab431c95d30e2583597f4692c35574.png";

export function Navigation({ activePage, mode = "RIDER", onModeToggle }) {
  const navigate = useNavigate();

  return (
    <nav className="bg-white h-[52px] shrink-0 w-full border-b border-black relative z-10">
      <div className="flex items-center justify-between h-full px-4">

        {/* Logo */}
        <button onClick={() => navigate("/home")} className="h-8 w-[134px] shrink-0">
          <img src={imgLogo} alt="Uni-Lift" className="h-full w-full object-contain object-left" />
        </button>

        {/* Center Nav Tabs */}
        <div className="flex items-end h-full gap-0">
          <button
            onClick={() => navigate("/home")}
            className={`h-full px-5 flex items-center gap-2 border-b-2 transition-colors ${
              activePage === "home" ? "border-black" : "border-transparent"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1.5 5C1.5 4.85 1.53 4.71 1.59 4.58C1.65 4.45 1.74 4.33 1.85 4.24L5.35 1.24C5.53 1.08 5.76 1 6 1C6.24 1 6.47 1.08 6.65 1.24L10.15 4.24C10.26 4.33 10.35 4.45 10.41 4.58C10.47 4.71 10.5 4.85 10.5 5V9.5C10.5 9.77 10.39 10.02 10.21 10.21C10.02 10.39 9.77 10.5 9.5 10.5H2.5C2.23 10.5 1.98 10.39 1.79 10.21C1.61 10.02 1.5 9.77 1.5 9.5V5Z"
                stroke={activePage === "home" ? "black" : "#666"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.5 10.5V6.5C7.5 6.37 7.45 6.24 7.35 6.15C7.26 6.05 7.13 6 7 6H5C4.87 6 4.74 6.05 4.65 6.15C4.55 6.24 4.5 6.37 4.5 6.5V10.5"
                stroke={activePage === "home" ? "black" : "#666"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={`font-mono text-[10px] tracking-[0.5px] ${activePage === "home" ? "text-black" : "text-[#666]"}`}>
              HOME
            </span>
          </button>

          <button
            onClick={() => navigate("/messages")}
            className={`h-full px-5 flex items-center gap-2 border-b-2 transition-colors ${
              activePage === "messages" ? "border-black" : "border-transparent"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M10.5 7.5C10.5 7.77 10.39 8.02 10.21 8.21C10.02 8.39 9.77 8.5 9.5 8.5H3.5L1.5 10.5V2.5C1.5 2.23 1.61 1.98 1.79 1.79C1.98 1.61 2.23 1.5 2.5 1.5H9.5C9.77 1.5 10.02 1.61 10.21 1.79C10.39 1.98 10.5 2.23 10.5 2.5V7.5Z"
                stroke={activePage === "messages" ? "black" : "#666"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={`font-mono text-[10px] tracking-[0.5px] ${activePage === "messages" ? "text-black" : "text-[#666]"}`}>
              MESSAGES
            </span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">

          {/* Mode Toggle */}
          <div className="flex items-center border border-black h-[23px]">
            <span className="px-2 font-mono text-[9px] text-[#666] tracking-[0.45px]">MODE:</span>
            <button
              onClick={onModeToggle}
              className={`h-full px-3 font-mono text-[9px] tracking-[0.45px] transition-colors ${
                mode === "RIDER" ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              RIDER
            </button>
            <button
              onClick={onModeToggle}
              className={`h-full px-3 font-mono text-[9px] tracking-[0.45px] flex items-center gap-1 transition-colors ${
                mode === "DRIVER" ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              DRIVER
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path
                  d="M3 6L5 4L3 2"
                  stroke={mode === "DRIVER" ? "white" : "black"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="0.8"
                />
              </svg>
            </button>
          </div>

          {/* SOS Button */}
          <button className="bg-[#ef4444] h-[25px] px-3 flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path
                d="M9.96 8.25L6.29 1.83C6.21 1.69 6.1 1.57 5.96 1.49C5.82 1.41 5.66 1.37 5.5 1.37C5.33 1.37 5.17 1.41 5.03 1.49C4.89 1.57 4.78 1.69 4.7 1.83L1.03 8.25C0.95 8.39 0.91 8.55 0.91 8.71C0.91 8.87 0.95 9.03 1.03 9.17C1.11 9.31 1.23 9.43 1.37 9.51C1.51 9.59 1.67 9.63 1.83 9.63H9.17C9.33 9.63 9.49 9.58 9.62 9.5C9.76 9.42 9.88 9.31 9.96 9.17C10.04 9.03 10.08 8.87 10.08 8.71C10.08 8.55 10.04 8.39 9.96 8.25Z"
                stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9"
              />
              <path d="M5.5 4.13V5.96" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9" />
              <path d="M5.5 7.79H5.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9" />
            </svg>
            <span className="font-mono text-[9px] text-white tracking-[0.45px]">SOS</span>
          </button>

          {/* User Badge */}
          <div className="border border-black h-[30px] flex items-center gap-2 px-2">
            <div className="bg-black size-5 flex items-center justify-center">
              <span className="font-mono text-[8px] text-white">SJ</span>
            </div>
            <span className="font-mono text-[9px] text-[#0a0a0a] tracking-[0.2px]">SARAH</span>
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
