import { Link } from "react-router";
import imgImg from "figma:asset/cf24a05d7bab431c95d30e2583597f4692c35574.png";
import imgImg2 from "figma:asset/441daa1dae41629e2a7035f925ccb7f3a7efff67.png";

export function Layout({ children }) {
  return (
    <div className="bg-white flex flex-col min-h-screen w-full">
      <div className="h-[63px] shrink-0 w-full relative">
        <div aria-hidden="true" className="absolute border-[#f3f4f6] border-b border-solid inset-0 pointer-events-none" />
        <div className="flex items-center justify-between px-[24px] h-full">
          <Link to="/home" className="h-[38px] w-[159px] relative shrink-0">
            <img
              alt="Uni-Lift"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              src={imgImg}
            />
          </Link>
          <p className="font-['Consolas:Bold',sans-serif] text-[12px] text-black tracking-[0.6px] whitespace-nowrap">
            {`{ AUTH REQUIRED }`}
          </p>
        </div>
      </div>

      <div className="flex-1 w-full">{children}</div>

      <div className="h-[40px] shrink-0 w-full relative">
        <div aria-hidden="true" className="absolute border-[#f3f4f6] border-t border-solid inset-0 pointer-events-none" />
        <div className="flex items-center justify-between px-[24px] h-full">
          <div className="flex items-center gap-[8px]">
            <div className="h-[12px] w-[13px] opacity-60 relative shrink-0">
              <img
                alt=""
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                src={imgImg2}
              />
            </div>
            <p className="font-['Consolas:Regular',sans-serif] text-[#6a7282] text-[10px] whitespace-nowrap">
              Protected by University Authentication Protocol
            </p>
          </div>

          <div className="flex items-center gap-[20px]">
            {["TERMS", "PRIVACY", "SUPPORT"].map((label) => (
              <p
                key={label}
                className="font-['Consolas:Medium',sans-serif] text-[#6a7282] text-[10px] tracking-[0.5px] whitespace-nowrap"
              >
                {label}
              </p>
            ))}
          </div>

          <p className="font-['Consolas:Regular',sans-serif] text-[#d1d5dc] text-[10px] tracking-[0.5px] whitespace-nowrap">
            © 2026 UNI-LIFT TERMINAL V1.0.4
          </p>
        </div>
      </div>
    </div>
  );
}
