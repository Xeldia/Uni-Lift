export function SettingToggle({ label, description, enabled, onChange }) {
  return (
    <div className="flex items-start justify-between gap-[16px] py-[16px] border-b border-black w-full">
      <div className="flex-1 min-w-0">
        <p className="font-['Consolas:Medium',sans-serif] text-[11px] text-black tracking-[1.1px] mb-[4px]">{label}</p>
        {description && (
          <p className="font-['Consolas:Regular',sans-serif] text-[9px] text-[#6a7282] tracking-[0.45px] leading-[1.4]">{description}</p>
        )}
      </div>

      <button
        onClick={() => onChange(!enabled)}
        aria-pressed={enabled}
        className={`shrink-0 relative h-[20px] w-[36px] border border-black transition-colors ${enabled ? "bg-black" : "bg-white"}`}
      >
        <div
          className={`absolute top-[2px] w-[14px] h-[14px] border border-black transition-all ${enabled ? "left-[18px] bg-white" : "left-[2px] bg-black"}`}
        />
      </button>
    </div>
  );
}
