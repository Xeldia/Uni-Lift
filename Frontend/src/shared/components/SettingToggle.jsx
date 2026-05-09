export function SettingToggle({ label, description, enabled, onChange }) {
  return (
    <div className="flex items-start justify-between gap-[16px] py-[16px] border-b border-black/20 w-full group hover:bg-[#f9f9f9] hover:px-[12px] -mx-[12px] hover:border-black transition-all duration-300 cursor-pointer" onClick={() => onChange(!enabled)}>
      <div className="flex-1 min-w-0">
        <p className="font-['Consolas:Medium',sans-serif] text-[11px] text-black tracking-[1.1px] mb-[4px] group-hover:text-black transition-colors">{label}</p>
        {description && (
          <p className="font-['Consolas:Regular',sans-serif] text-[9px] text-[#6a7282] tracking-[0.45px] leading-[1.4] group-hover:text-black/70 transition-colors">{description}</p>
        )}
      </div>

      <button
        type="button"
        aria-pressed={enabled}
        className={`shrink-0 relative h-[20px] w-[36px] border transition-all duration-300 ${enabled ? "bg-black border-black" : "bg-[#f3f4f6] border-black/20 group-hover:border-black"}`}
      >
        <div
          className={`absolute top-[1px] w-[16px] h-[16px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${enabled ? "left-[17px] bg-white border border-black" : "left-[1px] bg-black/40 group-hover:bg-black"}`}
        />
      </button>
    </div>
  );
}
