import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Navigation } from "../../../shared/layout/Navigation";
import { getRideHistory, getSession } from "../../../shared/lib/supabase";
import { useRideLifecycle } from "../../rides/hooks/useRideLifecycle";

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusChip({ status }) {
  const map = {
    COMPLETED: "bg-[#10b981] text-white",
    CANCELLED: "bg-[#ef4444] text-white",
  };
  return (
    <span className={`font-mono text-[7px] tracking-[0.5px] px-2 py-0.5 ${map[status] ?? "bg-gray-200 text-black"}`}>
      {status}
    </span>
  );
}

// ── Star rating display ───────────────────────────────────────────────────────
function StarRow({ rating }) {
  const score = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  rating = score;
  if (!score) return <span className="font-mono text-[8px] text-[#99a1af]">Not rated</span>;
  return (
    <span className="font-mono text-[9px] text-[#f59e0b]">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

// ── Ride card ────────────────────────────────────────────────────────────────
function RideCard({ ride, role }) {
  const date = new Date(ride.created_at);
  const dateStr = date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="border border-[#e5e7eb] p-4 hover:border-black transition-colors">
      {/* Row 1: date + status */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-mono text-[10px] text-black">{dateStr}</p>
          <p className="font-mono text-[8px] text-[#99a1af]">{timeStr}</p>
        </div>
        <StatusChip status={ride.status} />
      </div>

      {/* Row 2: route */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex flex-col items-center gap-1 mt-0.5 shrink-0">
          <div className="size-2 rounded-full border-2 border-[#2563eb]" />
          <div className="w-px h-6 bg-[#d1d5dc]" />
          <div className="size-2 bg-[#ef4444] rounded-sm" />
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <p className="font-mono text-[9px] text-[#6a7282] truncate">{ride.pickup}</p>
          <p className="font-mono text-[9px] text-black truncate">{ride.dropoff}</p>
        </div>
      </div>

      {/* Row 3: stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-[#f3f4f6]">
        <div>
          <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px]">FARE</p>
          <p className="font-mono text-[14px] text-black leading-none">
            {ride.fare != null ? `\u20b1${ride.fare}` : "—"}
          </p>
        </div>
        <div className="w-px h-6 bg-[#e5e7eb]" />
        <div>
          <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px]">DIST</p>
          <p className="font-mono text-[10px] text-black">
            {ride.distance_km != null ? `${ride.distance_km} km` : "—"}
          </p>
        </div>
        <div className="w-px h-6 bg-[#e5e7eb]" />
        <div>
          <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px]">TYPE</p>
          <p className="font-mono text-[10px] text-black">{ride.ride_type ?? "HABAL"}</p>
        </div>
        {role === "RIDER" && ride.status === "COMPLETED" && (
          <>
            <div className="w-px h-6 bg-[#e5e7eb]" />
            <div>
              <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px]">DRIVER</p>
              <StarRow rating={ride.rider_rating} />
            </div>
            <div className="w-px h-6 bg-[#e5e7eb]" />
            <div>
              <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px]">YOU</p>
              <StarRow rating={ride.driver_rating} />
            </div>
          </>
        )}
        {role === "DRIVER" && ride.status === "COMPLETED" && (
          <>
            <div className="w-px h-6 bg-[#e5e7eb]" />
            <div>
              <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px]">RIDER</p>
              <StarRow rating={ride.driver_rating} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export function RideHistoryPage() {
  const navigate = useNavigate();
  const { appMode } = useRideLifecycle();
  const isDriver = appMode === "DRIVER";
  const role = isDriver ? "DRIVER" : "RIDER";

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL | COMPLETED | CANCELLED

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const session = await getSession();
      const userId = session?.user?.id;
      if (!userId) { setLoading(false); return; }
      const data = await getRideHistory(userId, role);
      if (!cancelled) { setRides(data); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [role]);

  const filtered = filter === "ALL" ? rides : rides.filter((r) => r.status === filter);
  const totalFare = rides
    .filter((r) => r.status === "COMPLETED")
    .reduce((sum, r) => sum + (r.fare ?? 0), 0);
  const completedCount = rides.filter((r) => r.status === "COMPLETED").length;
  const cancelledCount = rides.filter((r) => r.status === "CANCELLED").length;

  return (
    <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
      <Navigation
        activePage="history"
        mode={appMode}
      />

      {/* Hero Bar */}
      <div className="bg-black h-[72px] shrink-0 flex items-center justify-between px-6">
        <div>
          <h1 className="font-mono text-[20px] text-white tracking-[0.5px]">RIDE HISTORY</h1>
          <p className="font-mono text-[9px] text-[#d1d5dc] tracking-[2px] mt-0.5">
            {loading ? "Loading..." : `${rides.length} TOTAL RIDES`}
          </p>
        </div>
        <button
          onClick={() => navigate("/home")}
          className="border border-white/40 px-3 py-1 hover:border-white transition-colors"
        >
          <span className="font-mono text-[9px] text-white">&larr; BACK</span>
        </button>
      </div>

      {/* Summary row */}
      {!loading && rides.length > 0 && (
        <div className="h-[56px] shrink-0 border-b border-[#e5e7eb] flex items-center px-6 gap-8">
          <div>
            <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">TOTAL RIDES</p>
            <p className="font-mono text-[18px] text-black leading-none">{rides.length}</p>
          </div>
          <div className="w-px h-8 bg-[#e5e7eb]" />
          <div>
            <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">COMPLETED</p>
            <p className="font-mono text-[18px] text-[#10b981] leading-none">{completedCount}</p>
          </div>
          <div className="w-px h-8 bg-[#e5e7eb]" />
          <div>
            <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">CANCELLED</p>
            <p className="font-mono text-[18px] text-[#ef4444] leading-none">{cancelledCount}</p>
          </div>
          {role === "DRIVER" && (
            <>
              <div className="w-px h-8 bg-[#e5e7eb]" />
              <div>
                <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px]">TOTAL EARNED</p>
                <p className="font-mono text-[18px] text-black leading-none">&#8369;{totalFare.toLocaleString()}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="h-[40px] shrink-0 border-b border-[#e5e7eb] flex">
        {["ALL", "COMPLETED", "CANCELLED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 font-mono text-[9px] tracking-[1px] transition-colors border-r border-[#e5e7eb] ${
              filter === tab ? "bg-black text-white" : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            {tab} ({tab === "ALL" ? rides.length : rides.filter((r) => r.status === tab).length})
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="font-mono text-[9px] text-[#99a1af] animate-pulse tracking-[1px]">LOADING RIDES...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-3 max-w-2xl mx-auto">
            {filtered.map((ride) => (
              <RideCard key={ride.id} ride={ride} role={role} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="bg-[#f3f4f6] size-16 mx-auto mb-4 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="10" cy="24" r="3" stroke="#99a1af" strokeWidth="2" />
                <circle cx="24" cy="24" r="3" stroke="#99a1af" strokeWidth="2" />
                <path d="M13 24H21M6 24H4V18L7 10H16L18 6H26L30 18V24H27" stroke="#99a1af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-mono text-[11px] text-black mb-1">NO RIDES FOUND</p>
            <p className="font-mono text-[9px] text-[#6a7282]">
              {filter !== "ALL" ? `No ${filter.toLowerCase()} rides` : "Your ride history will appear here"}
            </p>
            <button
              onClick={() => navigate("/home")}
              className="mt-4 h-[36px] px-6 bg-black font-mono text-[9px] text-white hover:bg-gray-900 transition-colors"
            >
              BOOK A RIDE
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="h-[32px] shrink-0 bg-[#f9f9f9] border-t border-[#e5e7eb] flex items-center px-6 justify-between">
        <span className="font-mono text-[8px] text-[#6a7282] tracking-[0.5px]">
          {loading ? "LOADING..." : `${filtered.length} OF ${rides.length} RIDES`}
        </span>
        <span className="font-mono text-[8px] text-[#99a1af] tracking-[0.5px]">LIVE &bull; SUPABASE</span>
      </footer>
    </div>
  );
}
