export function TerminalButton({ children, onClick, variant = "primary", type = "button", disabled = false }) {
  const isPrimary = variant === "primary";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-[44px] border border-black font-['Consolas:Bold',sans-serif] text-[10px] tracking-[1px] transition-colors ${
        isPrimary
          ? "bg-black text-white hover:bg-gray-900"
          : "bg-white text-black hover:bg-black hover:text-white"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}
