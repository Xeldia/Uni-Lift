export function TerminalInput({ label, icon, placeholder, type = "text", value, onChange, disabled = false }) {
  return (
    <div className="flex flex-col gap-[6px] w-full">
      <p className="font-['Consolas:Medium',sans-serif] text-[9px] text-black tracking-[1.5px] whitespace-nowrap">{label}</p>

      <div className="h-[46px] w-full relative border border-black flex items-center gap-[8px] px-[13px]">
        {icon && (
          <div className="shrink-0 size-[13px] relative">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-0 font-['Consolas:Regular',sans-serif] text-[11px] text-black tracking-[0.55px] outline-none placeholder:text-[#d1d5dc] min-w-0 disabled:opacity-60"
        />
      </div>
    </div>
  );
}
