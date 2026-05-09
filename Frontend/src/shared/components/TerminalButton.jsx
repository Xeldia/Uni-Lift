export function TerminalButton({ children, onClick, variant = "primary", type = "button", disabled = false }) {
  const isPrimary = variant === "primary";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-[44px] border border-black font-['Consolas:Bold',sans-serif] text-[10px] tracking-[1px] transition-all duration-200 active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_0px_black] ${
        isPrimary
          ? "bg-black text-white hover:bg-gray-800"
          : "bg-white text-black hover:bg-[#f9f9f9]"
      } ${!disabled && "hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[4px_4px_0px_0px_black]"} ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}
