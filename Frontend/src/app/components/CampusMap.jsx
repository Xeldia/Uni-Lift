const DEFAULT_DRIVERS = [
  { id: "marcus", initials: "M", x: "32%", y: "27%" },
  { id: "kyla",   initials: "C", x: "56%", y: "22%" },
  { id: "diego",  initials: "M", x: "68%", y: "60%" },
  { id: "anne",   initials: "S", x: "22%", y: "76%" },
];

export function CampusMap({ drivers, showCurrentLocation = true, compact = false }) {
  const activeDrivers = drivers || DEFAULT_DRIVERS;

  const buildingClass = "bg-[#c8c0b8] flex items-end justify-center pb-1.5";
  const labelClass = "font-mono text-[7px] text-[#6b5f55] tracking-[0.5px] text-center uppercase";

  return (
    <div className="relative w-full h-full bg-[#e8e4de] overflow-hidden">

      {/* Map Label */}
      <div className="absolute top-3 left-3 z-10 bg-[#5a6e5e] px-2 py-0.5">
        <span className="font-mono text-[8px] text-white tracking-[0.8px]">CIT-U CAMPUS MAP</span>
      </div>

      {/* LIVE Badge */}
      <div className="absolute top-3 right-3 z-10 bg-[#10b981] px-1.5 py-0.5 flex items-center gap-1">
        <div className="size-1.5 rounded-full bg-white animate-pulse" />
        <span className="font-mono text-[7px] text-white tracking-[0.8px]">LIVE</span>
      </div>

      {/* Building Grid */}
      <div className="absolute inset-0 flex flex-col" style={{ padding: "32px 12px 24px 12px", gap: "8px" }}>

        {/* Row 1 */}
        <div className="flex gap-2" style={{ flex: "1.1" }}>
          <div className="w-[10%] bg-[#d8d2ca]" />
          <div className={`${buildingClass} flex-1`}><span className={labelClass}>Admin<br />Bldg</span></div>
          <div className={`${buildingClass} flex-1`}><span className={labelClass}>Engineering<br />Block</span></div>
          <div className={`${buildingClass} flex-1`}><span className={labelClass}>Science<br />Building</span></div>
          <div className={`${buildingClass} flex-1`}><span className={labelClass}>Library</span></div>
        </div>

        {/* Road */}
        <div className="h-[8px] bg-[#e8e4de] shrink-0" />

        {/* Row 2 */}
        <div className="flex gap-2" style={{ flex: "1" }}>
          <div className={`${buildingClass} flex-1`}><span className={labelClass}>Chapel</span></div>
          <div className={`${buildingClass} flex-1`}><span className={labelClass}>Cafeteria</span></div>
          <div className={`${buildingClass} flex-1`}><span className={labelClass}>Gymnasium</span></div>
          <div className="flex-1 bg-[#c8d8b8]" />
        </div>

        {/* Road */}
        <div className="h-[8px] bg-[#e8e4de] shrink-0" />

        {/* Row 3 */}
        <div className="flex gap-2" style={{ flex: "1" }}>
          <div className="w-[10%] bg-[#c8d8b8]" />
          <div className="bg-[#c8d8b8]" style={{ width: "calc(10% + 8px)" }} />
          <div className={`${buildingClass} flex-1`}><span className={labelClass}>Dormitory</span></div>
          <div className={`${buildingClass} flex-1`}><span className={labelClass}>Parking</span></div>
          <div className="flex-1 bg-[#c8d8b8]" />
        </div>
      </div>

      {/* Scale Bar */}
      <div className="absolute bottom-2 left-4 flex items-center gap-1">
        <div className="w-12 h-[3px] bg-black" />
        <span className="font-mono text-[6px] text-black">100m</span>
      </div>

      {/* Compass */}
      <div className="absolute bottom-4 right-4 flex flex-col items-center gap-0.5">
        <span className="font-mono text-[8px] text-black">N</span>
        <div className="w-px h-3 bg-black" />
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
          <path d="M4 5L0 0H8L4 5Z" fill="black" />
        </svg>
      </div>

      {/* Current Location Dot */}
      {showCurrentLocation && (
        <div
          className="absolute z-20 flex items-center justify-center"
          style={{ left: "44%", top: "53%", transform: "translate(-50%, -50%)" }}
        >
          <div className="size-4 rounded-full bg-[#2563eb] border-2 border-white shadow-lg animate-pulse" />
        </div>
      )}

      {/* Driver Markers */}
      {activeDrivers.map((driver) => (
        <div
          key={driver.id}
          className="absolute z-20"
          style={{ left: driver.x, top: driver.y, transform: "translate(-50%, -50%)" }}
        >
          <div
            className="size-7 rounded-full flex items-center justify-center border-2 border-white shadow-md"
            style={{ backgroundColor: driver.color || "#0a0a0a" }}
          >
            <span className="font-mono text-[9px] text-white">{driver.initials}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
