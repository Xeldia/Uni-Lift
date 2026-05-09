import { useState, useEffect } from "react";
import { AdminNavigation } from "../components/AdminNavigation";
import { CampusMap } from "../../../shared/components/map/CampusMap";
import {
  getAdminRides,
  subscribeToAdminRides,
  forceEndRide,
} from "../../../shared/lib/supabase";

const toMapPoint = (lat, lng, label) =>
  lat != null && lng != null ? { lat: Number(lat), lng: Number(lng), label } : null;

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    IN_TRANSIT: "bg-[#2563eb]",
    COMPLETED:  "bg-[#10b981]",
    SEARCHING:  "bg-[#8b5cf6]",
    ACCEPTED:   "bg-[#f59e0b]",
    CANCELLED:  "bg-[#ef4444]",
  };
  return (
    <div className={`${colors[status] || "bg-black"} px-2 py-0.5 inline-flex`}>
      <span className="font-mono text-[7px] text-white tracking-[0.5px]">
        {(status ?? "").replace("_", " ")}
      </span>
    </div>
  );
}

// ─── Ride Row ─────────────────────────────────────────────────────────────────
function RideRow({ ride, isSelected, onSelect }) {
  const driverInitials = ride.driver_name
    ? ride.driver_name.split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase()
    : null;
  const riderInitials = (ride.rider_name ?? "?")
    .split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase() || "?";

  return (
    <tr
      className={`border-b border-[#f3f4f6] hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? "bg-[#f9f9f9]" : ""}`}
      onClick={onSelect}
    >
      <td className="py-3 px-4">
        <span className="font-mono text-[9px] text-[#6a7282]">{ride.id.slice(0, 8).toUpperCase()}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {driverInitials ? (
            <>
              <div className="bg-[#2563eb] size-6 flex items-center justify-center">
                <span className="font-mono text-[7px] text-white">{driverInitials}</span>
              </div>
              <span className="font-mono text-[9px] text-black">{ride.driver_name}</span>
            </>
          ) : (
            <span className="font-mono text-[8px] text-[#8b5cf6]">SEARCHING...</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="bg-black size-6 flex items-center justify-center">
            <span className="font-mono text-[7px] text-white">{riderInitials}</span>
          </div>
          <span className="font-mono text-[9px] text-black">{ride.rider_name ?? "Rider"}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div>
          <p className="font-mono text-[8px] text-[#10b981]">↑ {ride.pickup}</p>
          <p className="font-mono text-[8px] text-[#ef4444]">↓ {ride.dropoff}</p>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-[10px] text-black">₱{ride.fare}</span>
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={ride.status} />
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-[8px] text-[#99a1af]">
          {new Date(ride.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function RidesPage() {
  const [rides, setRides]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [forceEnding, setForceEnding]   = useState(false);

  // ── Fetch + real-time subscription ───────────────────────────────────────
  const fetchRides = async () => {
    setLoading(true);
    const data = await getAdminRides();
    setRides(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRides();
    const unsub = subscribeToAdminRides(fetchRides);
    return unsub;
  }, []);

  const selectedRide = rides.find((r) => r.id === selectedId);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredRides = rides.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (r.rider_name  ?? "").toLowerCase().includes(q) ||
      (r.driver_name ?? "").toLowerCase().includes(q) ||
      (r.pickup      ?? "").toLowerCase().includes(q) ||
      (r.dropoff     ?? "").toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Force end ─────────────────────────────────────────────────────────────
  const handleForceEnd = async (rideId) => {
    setForceEnding(true);
    const { error } = await forceEndRide(rideId);
    if (error) console.error("[forceEnd]", error.message);
    else { setSelectedId(null); await fetchRides(); }
    setForceEnding(false);
  };

  const selectedPickup = selectedRide
    ? toMapPoint(selectedRide.pickup_lat, selectedRide.pickup_lng, selectedRide.pickup)
    : null;
  const selectedDropoff = selectedRide
    ? toMapPoint(selectedRide.dropoff_lat, selectedRide.dropoff_lng, selectedRide.dropoff)
    : null;
  const selectedDriver = selectedRide
    ? toMapPoint(selectedRide.driver_lat, selectedRide.driver_lng, selectedRide.driver_name ?? "Driver")
    : null;

  // Summary stats
  const inProgress  = rides.filter((r) => r.status === "IN_TRANSIT").length;
  const searching   = rides.filter((r) => r.status === "SEARCHING").length;
  const completed   = rides.filter((r) => r.status === "COMPLETED").length;
  const totalRevenue = rides
    .filter((r) => r.status === "COMPLETED")
    .reduce((sum, r) => sum + (r.fare ?? 0), 0);

  const exportCsv = () => {
    const rows = filteredRides.map((r) => ({
      id: r.id,
      status: r.status,
      rider_name: r.rider_name ?? "",
      driver_name: r.driver_name ?? "",
      pickup: r.pickup ?? "",
      dropoff: r.dropoff ?? "",
      fare: r.fare ?? 0,
      ride_type: r.ride_type ?? "",
      created_at: r.created_at ?? "",
      started_at: r.started_at ?? "",
      completed_at: r.completed_at ?? "",
      cancelled_at: r.cancelled_at ?? "",
    }));
    const headers = Object.keys(rows[0] ?? {
      id: "", status: "", rider_name: "", driver_name: "", pickup: "", dropoff: "",
      fare: "", ride_type: "", created_at: "", started_at: "", completed_at: "", cancelled_at: "",
    });
    const esc = (v) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`;
    const content = [headers.join(","), ...rows.map((row) => headers.map((h) => esc(row[h])).join(","))].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rides-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
      <AdminNavigation activePage="rides" />

      {/* Hero Bar */}
      <div className="bg-black h-[72px] shrink-0 flex items-center justify-between px-6">
        <div>
          <h1 className="font-mono text-[20px] text-white tracking-[0.5px]">RIDE MANAGEMENT</h1>
          <p className="font-mono text-[9px] text-[#d1d5dc] tracking-[2px] mt-0.5">
            {loading ? "Loading..." : `${inProgress} in progress · ${searching} searching · ${completed} completed`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {inProgress > 0 && (
            <div className="border border-[#2563eb] px-3 py-1 flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-[#2563eb] animate-pulse" />
              <span className="font-mono text-[9px] text-[#2563eb]">{inProgress} LIVE</span>
            </div>
          )}
          <div className="border border-white/40 px-3 py-1">
            <span className="font-mono text-[9px] text-white">₱{totalRevenue.toLocaleString()} TOTAL</span>
          </div>
          <button onClick={exportCsv} className="border border-white/40 px-3 py-1 hover:border-white transition-colors">
            <span className="font-mono text-[9px] text-white">EXPORT CSV</span>
          </button>
          <button onClick={fetchRides} className="border border-white/40 px-3 py-1 hover:border-white transition-colors">
            <span className="font-mono text-[9px] text-white">↻ REFRESH</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main table */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Filter bar */}
          <div className="h-[52px] shrink-0 border-b border-[#e5e7eb] flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="w-[260px] h-[32px] border border-[#d1d5dc] flex items-center px-3 gap-2">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M5 9C7.21 9 9 7.21 9 5C9 2.79 7.21 1 5 1C2.79 1 1 2.79 1 5C1 7.21 2.79 9 5 9Z" stroke="#99a1af" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11 11L8 8" stroke="#99a1af" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rider, driver, route..."
                  className="flex-1 font-mono text-[9px] text-black bg-transparent outline-none placeholder:text-[#d1d5dc]"
                />
              </div>
              <div className="flex items-center border border-[#d1d5dc] h-[32px]">
                {["ALL", "SEARCHING", "ACCEPTED", "IN_TRANSIT", "COMPLETED", "CANCELLED"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`h-full px-2.5 font-mono text-[7px] tracking-[0.3px] transition-colors ${statusFilter === s ? "bg-black text-white" : "text-[#6a7282] hover:bg-gray-50"}`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <span className="font-mono text-[8px] text-[#99a1af]">{filteredRides.length} RIDES</span>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <p className="font-mono text-[10px] text-[#99a1af] animate-pulse">LOADING RIDES...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#f9f9f9] sticky top-0">
                  <tr className="border-b border-[#e5e7eb]">
                    <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">ID</th>
                    <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">DRIVER</th>
                    <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">RIDER</th>
                    <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">ROUTE</th>
                    <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">FARE</th>
                    <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">STATUS</th>
                    <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRides.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <p className="font-mono text-[10px] text-[#99a1af]">NO RIDES FOUND</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRides.map((ride) => (
                      <RideRow
                        key={ride.id}
                        ride={ride}
                        isSelected={selectedId === ride.id}
                        onSelect={() => setSelectedId(ride.id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </main>

        {/* Right Detail Panel */}
        {selectedRide && (
          <aside className="w-[340px] shrink-0 border-l border-[#e5e7eb] flex flex-col overflow-hidden">
            <div className="h-[56px] shrink-0 border-b border-[#e5e7eb] flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedRide.status} />
                <span className="font-mono text-[8px] text-[#99a1af]">
                  {selectedRide.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-100 rounded">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M9 3L3 9M3 3L9 9" stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Route */}
              <div className="border border-[#e5e7eb] p-3">
                <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-2">ROUTE</p>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="size-2 rounded-full border-2 border-[#10b981]" />
                    <div className="w-px h-5 bg-[#d1d5dc]" />
                    <div className="size-2 rounded-full border-2 border-[#ef4444]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="font-mono text-[9px] text-black">{selectedRide.pickup}</p>
                    <p className="font-mono text-[9px] text-black">{selectedRide.dropoff}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-[#e5e7eb] flex items-center justify-between">
                  <span className="font-mono text-[8px] text-[#99a1af]">FARE</span>
                  <span className="font-mono text-[16px] text-black">₱{selectedRide.fare}</span>
                </div>
              </div>

              {/* Map */}
              <div className="border border-[#e5e7eb] h-[190px] overflow-hidden">
                {selectedPickup && selectedDropoff ? (
                  <CampusMap
                    compact
                    showCurrentLocation={false}
                    pickup={selectedPickup}
                    destination={selectedDropoff}
                    inspectPickup={selectedPickup}
                    inspectDestination={selectedDropoff}
                    driverLocation={selectedDriver}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-[#f9f9f9] px-4 text-center">
                    <p className="font-mono text-[8px] text-[#99a1af] leading-4">
                      NO STORED COORDINATES FOR THIS RIDE
                    </p>
                  </div>
                )}
              </div>

              {/* People */}
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-[#e5e7eb] p-3">
                  <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-1">RIDER</p>
                  <p className="font-mono text-[9px] text-black">{selectedRide.rider_name ?? "—"}</p>
                </div>
                <div className="border border-[#e5e7eb] p-3">
                  <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-1">DRIVER</p>
                  <p className="font-mono text-[9px] text-black">{selectedRide.driver_name ?? "—"}</p>
                  {selectedRide.driver_vehicle && (
                    <p className="font-mono text-[7px] text-[#6a7282] mt-0.5">{selectedRide.driver_vehicle}</p>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="border border-[#e5e7eb] p-3">
                <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-2">TIMELINE</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] text-[#99a1af]">REQUESTED</span>
                    <span className="font-mono text-[8px] text-black">
                      {new Date(selectedRide.created_at).toLocaleString()}
                    </span>
                  </div>
                  {selectedRide.started_at && (
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8px] text-[#99a1af]">STARTED</span>
                      <span className="font-mono text-[8px] text-black">
                        {new Date(selectedRide.started_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedRide.completed_at && (
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8px] text-[#10b981]">COMPLETED</span>
                      <span className="font-mono text-[8px] text-black">
                        {new Date(selectedRide.completed_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedRide.cancelled_at && (
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8px] text-[#ef4444]">CANCELLED</span>
                      <span className="font-mono text-[8px] text-black">
                        {new Date(selectedRide.cancelled_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Type badge */}
              <div className="border border-[#e5e7eb] p-3">
                <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-1">RIDE TYPE</p>
                <span className="font-mono text-[10px] text-black">{selectedRide.ride_type ?? "—"}</span>
              </div>
            </div>

            {/* Force End action (only for active rides) */}
            <div className="h-[60px] shrink-0 border-t border-[#e5e7eb] flex items-center px-4 gap-2">
              {(selectedRide.status === "IN_TRANSIT" || selectedRide.status === "ACCEPTED") ? (
                <button
                  onClick={() => handleForceEnd(selectedRide.id)}
                  disabled={forceEnding}
                  className="flex-1 h-[36px] bg-[#ef4444] font-mono text-[9px] text-white tracking-[0.5px] hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {forceEnding ? "ENDING..." : "FORCE END RIDE"}
                </button>
              ) : (
                <div className="flex-1 h-[36px] border border-[#e5e7eb] flex items-center justify-center">
                  <span className="font-mono text-[8px] text-[#99a1af]">NO ACTIONS AVAILABLE</span>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer className="h-[32px] shrink-0 bg-[#f9f9f9] border-t border-[#e5e7eb] flex items-center px-6 justify-between">
        <span className="font-mono text-[8px] text-[#6a7282] tracking-[0.5px]">
          {loading ? "LOADING..." : `IN PROGRESS: ${inProgress} · SEARCHING: ${searching} · COMPLETED: ${completed} · REVENUE: ₱${totalRevenue.toLocaleString()}`}
        </span>
        <span className="font-mono text-[8px] text-[#99a1af] tracking-[0.5px]">LIVE · SUPABASE</span>
      </footer>
    </div>
  );
}
