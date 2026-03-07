import { useState } from "react";
import { AdminNavigation } from "../components/AdminNavigation";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_RIDES = [
  { id: "R001", driver: "Marcus Rivera", rider: "Anne Cruz", pickup: "CIT Main Gate", dropoff: "CIT-SSC Building", fare: 35, status: "IN_TRANSIT", scheduledAt: "2026-03-07 14:30", startedAt: "2026-03-07 14:32", vehicle: "Honda Click 150i" },
  { id: "R002", driver: "Kyla Santos", rider: "John Smith", pickup: "CIT Canteen", dropoff: "CIT Library", fare: 25, status: "COMPLETED", scheduledAt: "2026-03-07 13:00", startedAt: "2026-03-07 13:02", completedAt: "2026-03-07 13:15", vehicle: "Toyota Wigo" },
  { id: "R003", driver: "Diego Reyes", rider: "Emma Wilson", pickup: "CIT Gym", dropoff: "CIT Parking A", fare: 20, status: "SCHEDULED", scheduledAt: "2026-03-07 15:00", vehicle: "Yamaha NMAX 155" },
  { id: "R004", driver: "Leo Martinez", rider: "Sarah Chen", pickup: "CIT Engineering", dropoff: "CIT Main Gate", fare: 30, status: "CANCELLED", scheduledAt: "2026-03-07 12:00", cancelledAt: "2026-03-07 11:55", cancelReason: "Rider cancelled", vehicle: "Honda XRM Sidecar" },
  { id: "R005", driver: "Marcus Rivera", rider: "John Smith", pickup: "CIT Dormitory", dropoff: "CIT Science Bldg", fare: 40, status: "IN_TRANSIT", scheduledAt: "2026-03-07 14:45", startedAt: "2026-03-07 14:47", vehicle: "Honda Click 150i" },
  { id: "R006", driver: "Kyla Santos", rider: "Anne Cruz", pickup: "CIT Admin", dropoff: "CIT Cafeteria", fare: 15, status: "COMPLETED", scheduledAt: "2026-03-07 10:00", startedAt: "2026-03-07 10:02", completedAt: "2026-03-07 10:08", vehicle: "Toyota Wigo" },
  { id: "R007", driver: null, rider: "Emma Wilson", pickup: "CIT IT Building", dropoff: "CIT Main Gate", fare: 30, status: "SEARCHING", scheduledAt: "2026-03-07 15:30", vehicle: null },
  { id: "R008", driver: "Diego Reyes", rider: "Sarah Chen", pickup: "CIT Library", dropoff: "CIT Gym", fare: 25, status: "COMPLETED", scheduledAt: "2026-03-07 09:00", startedAt: "2026-03-07 09:03", completedAt: "2026-03-07 09:12", vehicle: "Yamaha NMAX 155" },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    IN_TRANSIT: "bg-[#2563eb]",
    COMPLETED: "bg-[#10b981]",
    SCHEDULED: "bg-[#f59e0b]",
    CANCELLED: "bg-[#ef4444]",
    SEARCHING: "bg-[#8b5cf6]",
  };
  return (
    <div className={`${colors[status] || "bg-black"} px-2 py-0.5 inline-flex`}>
      <span className="font-mono text-[7px] text-white tracking-[0.5px]">{status.replace("_", " ")}</span>
    </div>
  );
}

// ─── Ride Row ─────────────────────────────────────────────────────────────────
function RideRow({ ride, isSelected, onSelect }) {
  return (
    <tr
      className={`border-b border-[#f3f4f6] hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? "bg-[#f9f9f9]" : ""}`}
      onClick={onSelect}
    >
      <td className="py-3 px-4">
        <span className="font-mono text-[9px] text-[#6a7282]">{ride.id}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {ride.driver ? (
            <>
              <div className="bg-[#2563eb] size-6 flex items-center justify-center">
                <span className="font-mono text-[7px] text-white">
                  {ride.driver.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <span className="font-mono text-[9px] text-black">{ride.driver}</span>
            </>
          ) : (
            <span className="font-mono text-[8px] text-[#8b5cf6]">SEARCHING...</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="bg-black size-6 flex items-center justify-center">
            <span className="font-mono text-[7px] text-white">
              {ride.rider.split(" ").map(n => n[0]).join("")}
            </span>
          </div>
          <span className="font-mono text-[9px] text-black">{ride.rider}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-[#10b981]" />
            <span className="font-mono text-[8px] text-[#6a7282]">{ride.pickup}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-[#ef4444]" />
            <span className="font-mono text-[8px] text-[#6a7282]">{ride.dropoff}</span>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-[10px] text-black font-semibold">₱{ride.fare}</span>
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={ride.status} />
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-[8px] text-[#99a1af]">{ride.scheduledAt}</span>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function RidesPage() {
  const [rides] = useState(MOCK_RIDES);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const selectedRide = rides.find(r => r.id === selectedId);

  const filteredRides = rides.filter(r => {
    const matchesSearch = r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.rider.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.driver?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                          r.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.dropoff.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: rides.length,
    inTransit: rides.filter(r => r.status === "IN_TRANSIT").length,
    completed: rides.filter(r => r.status === "COMPLETED").length,
    scheduled: rides.filter(r => r.status === "SCHEDULED").length,
    cancelled: rides.filter(r => r.status === "CANCELLED").length,
    revenue: rides.filter(r => r.status === "COMPLETED").reduce((sum, r) => sum + r.fare, 0),
  };

  return (
    <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
      <AdminNavigation activePage="rides" />

      {/* Hero Bar */}
      <div className="bg-black h-[72px] shrink-0 flex items-center justify-between px-6">
        <div>
          <h1 className="font-mono text-[20px] text-white tracking-[0.5px]">RIDE MANAGEMENT</h1>
          <p className="font-mono text-[9px] text-[#d1d5dc] tracking-[2px] mt-0.5">
            Monitor and manage all campus rides
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="border border-[#2563eb] px-3 py-1 flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-[#2563eb] animate-pulse" />
            <span className="font-mono text-[9px] text-[#2563eb]">{stats.inTransit} IN TRANSIT</span>
          </div>
          <div className="border border-[#10b981] px-3 py-1 flex items-center gap-2">
            <span className="font-mono text-[9px] text-[#10b981]">₱{stats.revenue} TODAY</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Main Table Area */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Search & Filter Bar */}
          <div className="h-[52px] shrink-0 border-b border-[#e5e7eb] flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="w-[280px] h-[32px] border border-[#d1d5dc] flex items-center px-3 gap-2">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M5 9C7.21 9 9 7.21 9 5C9 2.79 7.21 1 5 1C2.79 1 1 2.79 1 5C1 7.21 2.79 9 5 9Z" stroke="#99a1af" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11 11L8 8" stroke="#99a1af" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rides, drivers, riders..."
                  className="flex-1 font-mono text-[9px] text-black bg-transparent outline-none placeholder:text-[#d1d5dc]"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center border border-[#d1d5dc] h-[32px]">
                {["ALL", "IN_TRANSIT", "SCHEDULED", "COMPLETED", "CANCELLED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`h-full px-3 font-mono text-[8px] tracking-[0.5px] transition-colors ${
                      statusFilter === status ? "bg-black text-white" : "text-[#6a7282] hover:bg-gray-50"
                    }`}
                  >
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-[#99a1af]">{filteredRides.length} RIDES</span>
              <button className="h-[32px] px-4 bg-black font-mono text-[9px] text-white tracking-[0.5px] hover:bg-gray-900 transition-colors">
                EXPORT
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-[#f9f9f9] sticky top-0">
                <tr className="border-b border-[#e5e7eb]">
                  <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">RIDE ID</th>
                  <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">DRIVER</th>
                  <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">RIDER</th>
                  <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">ROUTE</th>
                  <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">FARE</th>
                  <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">STATUS</th>
                  <th className="py-3 px-4 text-left font-mono text-[8px] text-[#99a1af] tracking-[1px]">TIME</th>
                </tr>
              </thead>
              <tbody>
                {filteredRides.map((ride) => (
                  <RideRow
                    key={ride.id}
                    ride={ride}
                    isSelected={selectedId === ride.id}
                    onSelect={() => setSelectedId(ride.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </main>

        {/* Right Detail Panel */}
        {selectedRide && (
          <aside className="w-[340px] shrink-0 border-l border-[#e5e7eb] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-[80px] shrink-0 border-b border-[#e5e7eb] flex items-center justify-between px-4">
              <div>
                <p className="font-mono text-[16px] text-black">{selectedRide.id}</p>
                <StatusBadge status={selectedRide.status} />
              </div>
              <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-100 rounded">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M9 3L3 9M3 3L9 9" stroke="#6a7282" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Route */}
              <div className="border border-[#e5e7eb] p-3">
                <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-3">ROUTE</p>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-0.5 mt-1">
                    <div className="size-2.5 rounded-full border-2 border-[#10b981] bg-white" />
                    <div className="w-px h-8 bg-[#d1d5dc]" />
                    <div className="size-2.5 rounded-full border-2 border-[#ef4444] bg-white" />
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="font-mono text-[7px] text-[#10b981]">PICKUP</p>
                      <p className="font-mono text-[10px] text-black">{selectedRide.pickup}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[7px] text-[#ef4444]">DROPOFF</p>
                      <p className="font-mono text-[10px] text-black">{selectedRide.dropoff}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver & Rider */}
              <div className="grid grid-cols-2 gap-3">
                {/* Driver */}
                <div className="border border-[#e5e7eb] p-3">
                  <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-2">DRIVER</p>
                  {selectedRide.driver ? (
                    <div className="flex items-center gap-2">
                      <div className="bg-[#2563eb] size-8 flex items-center justify-center">
                        <span className="font-mono text-[9px] text-white">
                          {selectedRide.driver.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-mono text-[9px] text-black">{selectedRide.driver}</p>
                        <p className="font-mono text-[7px] text-[#6a7282]">{selectedRide.vehicle}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="font-mono text-[9px] text-[#8b5cf6]">Searching...</p>
                  )}
                </div>

                {/* Rider */}
                <div className="border border-[#e5e7eb] p-3">
                  <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-2">RIDER</p>
                  <div className="flex items-center gap-2">
                    <div className="bg-black size-8 flex items-center justify-center">
                      <span className="font-mono text-[9px] text-white">
                        {selectedRide.rider.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <p className="font-mono text-[9px] text-black">{selectedRide.rider}</p>
                  </div>
                </div>
              </div>

              {/* Fare */}
              <div className="border border-[#e5e7eb] p-3">
                <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-2">FARE</p>
                <p className="font-mono text-[24px] text-black">₱{selectedRide.fare}</p>
              </div>

              {/* Timeline */}
              <div className="border border-[#e5e7eb] p-3">
                <p className="font-mono text-[7px] text-[#99a1af] tracking-[1.5px] mb-3">TIMELINE</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] text-[#6a7282]">Scheduled</span>
                    <span className="font-mono text-[8px] text-black">{selectedRide.scheduledAt}</span>
                  </div>
                  {selectedRide.startedAt && (
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8px] text-[#6a7282]">Started</span>
                      <span className="font-mono text-[8px] text-black">{selectedRide.startedAt}</span>
                    </div>
                  )}
                  {selectedRide.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8px] text-[#10b981]">Completed</span>
                      <span className="font-mono text-[8px] text-[#10b981]">{selectedRide.completedAt}</span>
                    </div>
                  )}
                  {selectedRide.cancelledAt && (
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8px] text-[#ef4444]">Cancelled</span>
                      <span className="font-mono text-[8px] text-[#ef4444]">{selectedRide.cancelledAt}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cancel Reason */}
              {selectedRide.cancelReason && (
                <div className="border border-[#ef4444] p-3 bg-[#fef2f2]">
                  <p className="font-mono text-[7px] text-[#ef4444] tracking-[1.5px] mb-2">CANCELLATION REASON</p>
                  <p className="font-mono text-[9px] text-[#ef4444]">{selectedRide.cancelReason}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="h-[60px] shrink-0 border-t border-[#e5e7eb] flex items-center justify-between px-4">
              <button className="h-[32px] px-4 border border-black font-mono text-[8px] text-black tracking-[0.5px] hover:bg-black hover:text-white transition-colors">
                VIEW MAP
              </button>
              {selectedRide.status === "IN_TRANSIT" && (
                <button className="h-[32px] px-4 bg-[#ef4444] font-mono text-[8px] text-white tracking-[0.5px] hover:bg-red-600 transition-colors">
                  FORCE END
                </button>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer className="h-[32px] shrink-0 bg-[#f9f9f9] border-t border-[#e5e7eb] flex items-center px-6 justify-between">
        <span className="font-mono text-[8px] text-[#6a7282] tracking-[0.5px]">
          TOTAL: {stats.total} • IN TRANSIT: {stats.inTransit} • SCHEDULED: {stats.scheduled} • COMPLETED: {stats.completed} • CANCELLED: {stats.cancelled}
        </span>
        <span className="font-mono text-[8px] text-[#99a1af] tracking-[0.5px]">LIVE</span>
      </footer>
    </div>
  );
}
