export function TerminalInput({ label, icon, placeholder, type = "text", value, onChange, disabled = false }) {
  return (
    <div className="flex flex-col gap-[6px] w-full group">
      <p className="font-['Consolas:Medium',sans-serif] text-[9px] text-black tracking-[1.5px] whitespace-nowrap group-focus-within:font-['Consolas:Bold',sans-serif] transition-all">{label}</p>

      <div className={`h-[46px] w-full relative border flex items-center gap-[8px] px-[13px] transition-all duration-200 bg-white ${disabled ? 'border-black/20 opacity-60' : 'border-black group-hover:-translate-y-[2px] group-hover:-translate-x-[2px] group-hover:shadow-[4px_4px_0px_0px_black] group-focus-within:-translate-y-[2px] group-focus-within:-translate-x-[2px] group-focus-within:shadow-[4px_4px_0px_0px_black]'}`}>
        {icon && (
          <div className="shrink-0 size-[13px] relative transition-transform duration-200 group-focus-within:scale-110">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-0 font-['Consolas:Regular',sans-serif] text-[11px] text-black tracking-[0.55px] outline-none placeholder:text-[#d1d5dc] min-w-0 disabled:opacity-60 transition-all"
        />
      </div>
    </div>
  );
}
