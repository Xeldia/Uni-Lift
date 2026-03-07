import { useState } from "react";
import { useNavigate } from "react-router";
import { Navigation } from "../components/Navigation";
import { CampusMap } from "../components/CampusMap";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ACTIVE_DRIVERS = [
  { id: "MR", name: "Marcus Rivera",  vehicle: "Honda Click 150i · YZA 4521", type: "MOTO",    rating: 4.8, distance: "0.3 km", price: "30 (gas)", status: "ACTIVE", statusColor: "bg-[#10b981]" },
  { id: "KS", name: "Kyla Santos",    vehicle: "Toyota Wigo · ABC 1234",       type: "CAR",     rating: 4.5, distance: "0.7 km", price: "50",       status: "ACTIVE", statusColor: "bg-[#10b981]" },
  { id: "DR", name: "Diego Reyes",    vehicle: "Yamaha NMAX 155 · XYZ 8999",  type: "MOTO",    rating: 4.0, distance: "1.2 km", price: "25 (gas)", status: "ACTIVE", statusColor: "bg-[#10b981]" },
  { id: "AC", name: "Anne Cruz",      vehicle: "Honda XRM Sidecar · DEF 5678",type: "SIDECAR", rating: 4.5, distance: "1.8 km", price: "40",       status: "BUSY",   statusColor: "bg-[#f59e0b]" },
];

const RECENT_RIDES = [
  { from: "Science Block", to: "SM City",     driver: "Diego Reyes", time: "yesterday", price: "FREE" },
  { from: "Library",       to: "Dorm Block A", driver: "Kyla Santos", time: "yesterday", price: "₱50"  },
];

const QUICK_DESTINATIONS = ["Main Campus Plaza", "Engineering Block", "Science Building", "Library"];

// ─── Small Icons ──────────────────────────────────────────────────────────────
function LocationIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M9.17 4.58C9.17 6.87 6.63 9.26 5.78 9.99C5.7 10.05 5.6 10.08 5.5 10.08C5.4 10.08 5.3 10.05 5.22 9.99C4.37 9.26 1.83 6.87 1.83 4.58C1.83 3.61 2.22 2.68 2.91 1.99C3.59 1.3 4.53 0.92 5.5 0.92C6.47 0.92 7.41 1.3 8.09 1.99C8.78 2.68 9.17 3.61 9.17 4.58Z" stroke="#2563EB" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.92" />
      <path d="M5.5 5.96C6.26 5.96 6.88 5.34 6.88 4.58C6.88 3.82 6.26 3.21 5.5 3.21C4.74 3.21 4.13 3.82 4.13 4.58C4.13 5.34 4.74 5.96 5.5 5.96Z" stroke="#2563EB" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.92" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M4.58 8.25C6.59 8.25 8.25 6.59 8.25 4.58C8.25 2.56 6.59 0.92 4.58 0.92C2.56 0.92 0.92 2.56 0.92 4.58C0.92 6.59 2.56 8.25 4.58 8.25Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.92" />
      <path d="M10.08 10.08L7.15 7.15" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.92" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
      <path d="M4.32 0.86L5.19 2.62C5.25 2.73 5.33 2.83 5.44 2.91C5.54 2.98 5.66 3.03 5.79 3.05L7.73 3.33C7.83 3.34 7.87 3.43 7.83 3.53L6.43 5.04C6.27 5.19 6.19 5.42 6.22 5.64L6.53 7.67C6.55 7.8 6.44 7.91 6.32 7.88L4.52 6.97C4.41 6.91 4.28 6.88 4.15 6.88C4.02 6.88 3.89 6.91 3.78 6.97L1.97 7.88C1.85 7.91 1.74 7.8 1.76 7.67L2.1 5.64C2.12 5.42 2.04 5.19 1.87 5.04L0.47 3.53C0.43 3.43 0.47 3.34 0.57 3.33L2.5 3.05C2.72 3.02 2.91 2.88 3.01 2.68L3.97 0.86C4.07 0.67 4.32 0.67 4.32 0.86Z" fill="#f59e0b" />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function HomePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("RIDER");
  const [pickup, setPickup] = useState("Current Location");
  const [destination, setDestination] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("ALL");

  const filteredDrivers = vehicleFilter === "ALL"
    ? ACTIVE_DRIVERS
    : ACTIVE_DRIVERS.filter((d) => d.type === vehicleFilter);

  return (
    <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
      <Navigation
        activePage="home"
        mode={mode}
        onModeToggle={() => setMode(mode === "RIDER" ? "DRIVER" : "RIDER")}
      />

      {/* Hero Bar */}
      <div className="bg-black h-[72px] shrink-0 flex items-center justify-between px-6">
        <div>
          <h1 className="font-mono text-[20px] text-white tracking-[0.5px]">WHERE TO TODAY?</h1>
          <p className="font-mono text-[9px] text-[#d1d5dc] tracking-[2px] mt-0.5">
            Safe, verified rides across campus and beyond
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-[#10b981]" />
          <span className="font-mono text-[8px] text-[#d1d5dc] tracking-[0.5px]">
            NODE: 0x2A99 • SYSTEM ONLINE
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Panel – Ride Request */}
        <aside className="w-[270px] shrink-0 border-r border-[#e5e7eb] flex flex-col overflow-y-auto">

          {/* Ride Request */}
          <div className="p-3 border-b border-[#e5e7eb]">
            <p className="font-mono text-[8px] text-[#99a1af] tracking-[2px] mb-3">RIDE REQUEST</p>

            {/* Pickup */}
            <div className="mb-2">
              <p className="font-mono text-[8px] text-[#6a7282] tracking-[1px] mb-1">PICKUP LOCATION</p>
              <div className="border border-[#d1d5dc] flex items-center gap-2 px-2 h-[34px]">
                <LocationIcon />
                <input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="flex-1 font-mono text-[10px] text-black bg-transparent outline-none tracking-[0.3px]"
                />
              </div>
            </div>

            {/* Destination */}
            <div className="mb-2">
              <p className="font-mono text-[8px] text-[#6a7282] tracking-[1px] mb-1">DESTINATION</p>
              <div className="border border-[#d1d5dc] flex items-center gap-2 px-2 h-[34px]">
                <SearchIcon />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Search destination..."
                  className="flex-1 font-mono text-[10px] text-black bg-transparent outline-none tracking-[0.3px] placeholder:text-[#d1d5dc]"
                />
              </div>
            </div>

            {/* Quick Destinations */}
            <div className="flex flex-wrap gap-1 mb-3">
              {QUICK_DESTINATIONS.map((dest) => (
                <button
                  key={dest}
                  onClick={() => setDestination(dest)}
                  className="font-mono text-[8px] text-[#6a7282] tracking-[0.3px] border border-[#e5e7eb] px-1.5 py-0.5 hover:bg-black hover:text-white hover:border-black transition-colors"
                >
                  {dest}
                </button>
              ))}
            </div>

            {/* Find Driver */}
            <button
              onClick={() => navigate("/messages")}
              className="w-full bg-black h-[38px] flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
            >
              <span className="font-mono text-[10px] text-white tracking-[0.5px]">FIND A DRIVER</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 9L7.5 6L4.5 3" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Activity Status */}
          <div className="p-3 border-b border-[#e5e7eb]">
            <p className="font-mono text-[8px] text-[#99a1af] tracking-[2px] mb-2">ACTIVITY STATUS</p>
            <div className="flex items-center gap-2 p-2 bg-[#f9f9f9] border border-[#e5e7eb]">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 0.92C2.96 0.92 0.92 2.97 0.92 5.5C0.92 8.03 2.96 10.08 5.5 10.08C8.03 10.08 10.08 8.03 10.08 5.5C10.08 2.97 8.03 0.92 5.5 0.92Z" stroke="#99A1AF" strokeWidth="0.92" />
                <path d="M5.5 2.75V5.5L7.33 6.42" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.92" />
              </svg>
              <div>
                <p className="font-mono text-[9px] text-[#0a0a0a]">No active rides</p>
                <p className="font-mono text-[8px] text-[#99a1af] tracking-[0.3px]">READY TO BOARD</p>
              </div>
            </div>
          </div>

          {/* Recent Rides */}
          <div className="p-3">
            <p className="font-mono text-[8px] text-[#99a1af] tracking-[2px] mb-2">RECENT</p>
            {RECENT_RIDES.map((ride, i) => (
              <button
                key={i}
                onClick={() => navigate("/messages")}
                className="w-full text-left p-2 hover:bg-gray-50 transition-colors border border-transparent hover:border-[#e5e7eb] mb-1"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-mono text-[9px] text-black">{ride.from} → {ride.to}</span>
                  <span className={`font-mono text-[8px] ${ride.price === "FREE" ? "text-[#10b981]" : "text-[#6a7282]"}`}>
                    {ride.price}
                  </span>
                </div>
                <p className="font-mono text-[8px] text-[#6a7282] tracking-[0.3px]">
                  {ride.driver} · {ride.time}
                </p>
              </button>
            ))}
          </div>
        </aside>

        {/* Campus Map */}
        <main className="flex-1 relative overflow-hidden">
          <CampusMap />
        </main>

        {/* Right Panel – Active Drivers */}
        <aside className="w-[200px] shrink-0 border-l border-[#e5e7eb] flex flex-col overflow-hidden">

          {/* Header + Filter */}
          <div className="p-3 border-b border-[#e5e7eb]">
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[8px] text-[#99a1af] tracking-[2px]">ACTIVE DRIVERS</p>
              <div className="bg-[#10b981] px-1.5 py-0.5 flex items-center gap-1">
                <div className="size-1.5 rounded-full bg-white" />
                <span className="font-mono text-[7px] text-white">3 LIVE</span>
              </div>
            </div>
            <div className="flex gap-1">
              {["ALL", "MOTO", "CAR", "SIDECAR"].map((f) => (
                <button
                  key={f}
                  onClick={() => setVehicleFilter(f)}
                  className={`font-mono text-[7px] tracking-[0.3px] px-1 py-0.5 border transition-colors ${
                    vehicleFilter === f
                      ? "bg-black text-white border-black"
                      : "bg-white text-[#99a1af] border-[#e5e7eb] hover:border-black"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Driver List */}
          <div className="flex-1 overflow-y-auto">
            {filteredDrivers.map((driver) => (
              <div key={driver.id} className="p-3 border-b border-[#f3f4f6]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-black size-8 flex items-center justify-center shrink-0">
                      <span className="font-mono text-[9px] text-white">{driver.id}</span>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-black">{driver.name}</p>
                      <div className="flex items-center gap-1">
                        <div className={`size-1.5 rounded-full ${driver.statusColor}`} />
                        <span className="font-mono text-[7px] text-[#6a7282] tracking-[0.5px]">{driver.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <StarIcon />
                    <span className="font-mono text-[8px] text-black">{driver.rating}</span>
                  </div>
                </div>

                <p className="font-mono text-[8px] text-[#6a7282] tracking-[0.2px] mb-1">{driver.vehicle}</p>

                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[8px] text-[#6a7282]">↗ {driver.distance}</span>
                  <span className="font-mono text-[8px] text-black">₱{driver.price}</span>
                </div>

                <button
                  onClick={() => navigate("/messages")}
                  className="w-full border border-black h-[22px] flex items-center justify-center hover:bg-black hover:text-white transition-colors group"
                >
                  <span className="font-mono text-[8px] text-black tracking-[0.5px] group-hover:text-white">CHAT &gt;</span>
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
