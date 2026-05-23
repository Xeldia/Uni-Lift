/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-nested-conditional, no-negated-condition, no-array-index-key */
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRideLifecycle } from "../hooks/useRideLifecycle";
import { useDriverGPS } from "../hooks/useDriverGPS";
import { SOSButton } from "./SOSOverlay";
import {
  subscribeToSearchingRides,
  acceptRiderPricedRide,
  proposeFare,
  resetFareProposal,
  subscribeToRide,
  startTrip,
  completeTrip,
  submitDriverRiderRating,
  updateDriverGPS,
  setDriverStatus as updateDriverStatus,
  getDriverVehicleProfile,
  getSession,
  getDriverStats,
  type DriverStatus,
  type SearchingRide,
} from "../../../shared/lib/supabase";

// ─── OSRM route helper (simulate only) ────────────────────────────────────────
async function fetchOsrmRoute(
  fromLat: number, fromLng: number,
  toLat: number,   toLng: number
): Promise<{ lat: number; lng: number }[] | null> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${fromLng},${fromLat};${toLng},${toLat}` +
      `?overview=full&geometries=geojson`;
    const res  = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
    if (!coords?.length) return null;
    return coords.map(([lng, lat]) => ({ lat, lng }));
  } catch { return null; }
}

function sampleRoute(
  points: { lat: number; lng: number }[],
  n: number
): { lat: number; lng: number }[] {
  if (points.length <= n) return points;
  return Array.from({ length: n }, (_, i) => {
    const idx = Math.round((i / (n - 1)) * (points.length - 1));
    return points[idx];
  });
}

// ─── Status configuration ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  DriverStatus,
  { label: string; dot: string; bg: string; text: string; next: DriverStatus; nextLabel: string }
> = {
  TAKING_ORDERS: {
    label: "TAKING ORDERS",
    dot: "bg-[#10b981]",
    bg: "bg-[#d1fae5]",
    text: "text-[#065f46]",
    next: "ONLINE",
    nextLabel: "Pause Orders",
  },
  ONLINE: {
    label: "ONLINE",
    dot: "bg-[#f59e0b]",
    bg: "bg-[#fef3c7]",
    text: "text-[#92400e]",
    next: "OFFLINE",
    nextLabel: "Go Offline",
  },
  OFFLINE: {
    label: "OFFLINE",
    dot: "bg-[#9ca3af]",
    bg: "bg-[#f3f4f6]",
    text: "text-[#6a7282]",
    next: "TAKING_ORDERS",
    nextLabel: "Go Online",
  },
};

const RIDE_TYPE_BADGE: Record<string, string> = {
  HABAL:   "bg-[#fef3c7] text-[#92400e]",
  CAR:     "bg-[#dbeafe] text-[#1e40af]",
  SHUTTLE: "bg-[#d1fae5] text-[#065f46]",
  PREMIUM: "bg-[#ede9fe] text-[#5b21b6]",
};

// ─── Single request card ──────────────────────────────────────────────────────
function RequestCard({
  ride,
  onAccept,
  onSkip,
  onInspect,
  onPropose,
  accepting,
  proposing,
  proposeCoolingDown,
  proposeCooldownSecs,
}: Readonly<{
  ride: SearchingRide;
  onAccept: (ride: SearchingRide) => void;
  onSkip: (id: string) => void;
  onInspect: (ride: SearchingRide) => void;
  onPropose: (ride: SearchingRide, fare: number) => void;
  accepting: boolean;
  proposing: boolean;
  proposeCoolingDown: boolean;
  proposeCooldownSecs: number;
}>) {
  const [showCounter, setShowCounter] = useState(false);
  const [counterFare, setCounterFare] = useState(String(ride.fare));

  const minutesAgo = Math.floor(
    (Date.now() - new Date(ride.created_at).getTime()) / 60000
  );
  const timeLabel = minutesAgo === 0 ? "just now" : `${minutesAgo}m ago`;
  const passengerCount = Math.max(1, ride.passenger_count ?? 1);
  const riderInitials = (ride.rider_name ?? ride.rider_id)
    .split(" ").map((n: string) => n[0] ?? "").join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="border border-[#e5e7eb] p-3 mx-3 mb-2 bg-white hover:border-black transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="bg-black size-6 rounded-full flex items-center justify-center">
            <span className="font-mono text-[8px] text-white">{riderInitials}</span>
          </div>
          <span className="font-mono text-[10px] text-black">
            {ride.rider_name ?? "Rider"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`font-mono text-[7px] px-1.5 py-0.5 rounded ${RIDE_TYPE_BADGE[ride.ride_type] ?? "bg-[#f3f4f6] text-[#6a7282]"}`}>
            {ride.ride_type}
          </span>
          <span className="font-mono text-[8px] text-[#99a1af]">{timeLabel}</span>
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <div className="size-2 rounded-full border-2 border-[#2563eb]" />
          <div className="w-px h-4 bg-[#d1d5dc]" />
          <div className="size-2 bg-[#ef4444] rounded-sm" />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="font-mono text-[9px] text-[#6a7282] truncate">{ride.pickup}</p>
          <p className="font-mono text-[9px] text-black truncate">{ride.dropoff}</p>
        </div>
      </div>

      {/* Distance + rider-set fare */}
      <div className="flex items-center gap-3 mb-3">
        <div>
          <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px]">DIST</p>
          <p className="font-mono text-[11px] text-black">{ride.distance_km} km</p>
        </div>
        <div className="w-px h-6 bg-[#e5e7eb]" />
        <div>
          <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px]">PAX</p>
          <p className="font-mono text-[11px] text-black">{passengerCount}</p>
        </div>
        <div className="w-px h-6 bg-[#e5e7eb]" />
        <div>
          <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px]">FARE</p>
          <p className="font-mono text-[11px] text-black">₱{ride.fare}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onAccept(ride)}
          disabled={accepting || proposing}
          className="flex-1 h-[30px] bg-black flex items-center justify-center gap-1 hover:bg-gray-900 transition-colors disabled:opacity-50"
        >
          <span className="font-mono text-[8px] text-white tracking-[0.5px]">
            {accepting ? "ACCEPTING..." : "ACCEPT ₱" + ride.fare}
          </span>
        </button>
        <button
          onClick={() => { setShowCounter((v) => !v); setCounterFare(String(ride.fare)); }}
          disabled={accepting || proposing || proposeCoolingDown}
          title={proposeCoolingDown ? `Wait ${proposeCooldownSecs}s` : undefined}
          className={`h-[30px] px-2 border font-mono text-[8px] transition-colors disabled:opacity-50 ${
            showCounter
              ? "border-[#f59e0b] text-[#92400e] bg-[#fef3c7]"
              : "border-[#f59e0b] text-[#92400e] hover:bg-[#fef3c7]"
          }`}
        >
          {proposeCoolingDown ? `${proposeCooldownSecs}s` : "COUNTER"}
        </button>
        <button
          onClick={() => onInspect(ride)}
          className="h-[30px] px-2 border border-[#2563eb] font-mono text-[8px] text-[#2563eb] hover:bg-[#2563eb] hover:text-white transition-colors"
        >
          🗺
        </button>
        <button
          onClick={() => onSkip(ride.id)}
          className="h-[30px] px-2 border border-[#d1d5dc] font-mono text-[8px] text-[#6a7282] hover:border-black hover:text-black transition-colors"
        >
          SKIP
        </button>
      </div>

      {/* Inline counter-offer input */}
      {showCounter && (
        <div className="mt-2 flex gap-1.5 items-center">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[9px] text-[#6a7282]">₱</span>
            <input
              type="number"
              min="1"
              step="1"
              value={counterFare}
              onChange={(e) => setCounterFare(e.target.value)}
              className="w-full h-[30px] pl-5 pr-2 border border-[#f59e0b] font-mono text-[10px] text-black focus:outline-none"
              placeholder="Your price"
            />
          </div>
          <button
            disabled={proposing || !counterFare || Number(counterFare) <= 0}
            onClick={() => {
              const parsed = Number(counterFare);
              if (parsed > 0) { onPropose(ride, parsed); setShowCounter(false); }
            }}
            className="h-[30px] px-3 bg-[#f59e0b] font-mono text-[8px] text-white tracking-[0.5px] hover:bg-amber-500 transition-colors disabled:opacity-50"
          >
            {proposing ? "..." : "PROPOSE"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function DriverRequestFeed({
  onInspect,
  onTripComplete,
  onTripStart,
  onSimulationPosition,
}: Readonly<{
  onInspect?: (ride: SearchingRide) => void;
  onTripComplete?: () => void;
  onTripStart?: () => void;
  onSimulationPosition?: (pos: { lat: number; lng: number }) => void;
}>) {
  const { driver_goOffline } = useRideLifecycle();
  const [rides, setRides] = useState<SearchingRide[]>([]);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  // Restore status from localStorage so it survives page refresh
  const [driverStatus, setDriverStatus] = useState<DriverStatus>(
    () => (localStorage.getItem("uni_lift_driver_status") as DriverStatus) ?? "OFFLINE"
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [vehicleReady, setVehicleReady] = useState(false);
  const [statusNotice, setStatusNotice] = useState("");
  const [accepting, setAccepting] = useState<string | null>(null);
  const [todayRides, setTodayRides] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  // Accepted ride state — tracks the ride the driver accepted (for START TRIP)
  const [acceptedRide, setAcceptedRide] = useState<{
    id: string; pickup: string; dropoff: string; fare: number;
    passenger_count: number;
    pickup_lat: number | null; pickup_lng: number | null;
    dropoff_lat: number | null; dropoff_lng: number | null;
  } | null>(null);
  const [tripStarted, setTripStarted] = useState(false);
  const [startingTrip, setStartingTrip] = useState(false);
  const [endingTrip, setEndingTrip] = useState(false);
  const [simulatingTrip, setSimulatingTrip] = useState(false);
  const [tripEnded, setTripEnded] = useState(false);
  // Pending fare proposal — driver proposed a counter-fare, waiting for rider response
  const [pendingProposal, setPendingProposal] = useState<{
    ride: SearchingRide; proposedFare: number;
  } | null>(null);
  const [proposingForRide, setProposingForRide] = useState<string | null>(null);
  // Rate limit: 30 s cooldown between proposals (prevents spam)
  const PROPOSE_COOLDOWN_MS = 30_000;
  const [proposeCooldownUntil, setProposeCooldownUntil] = useState(0);
  const [proposeCooldownSecs, setProposeCooldownSecs] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [ratingTags, setRatingTags] = useState<string[]>([]);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingSaved, setRatingSaved] = useState(false);
  const DRIVER_RATING_TAGS = ["Polite", "On Time", "Respectful", "Easy Pickup", "Safe"];
  // SOS freeze — true while an SOS alert is SENT/RECEIVED on this ride
  const [sosActive, setSosActive] = useState(false);
  // Ref so async simulation loop can read latest sosActive without stale closure
  const sosActiveRef = useRef(false);
  useEffect(() => { sosActiveRef.current = sosActive; }, [sosActive]);

  // Activate GPS tracking when trip starts (stops automatically when tripStarted becomes false)
  useDriverGPS(tripStarted && acceptedRide ? acceptedRide.id : null);

  // Top accent bar class (matches rider overlay):
  // • Green when trip started, • Amber when ride accepted but not started,
  // • Black pulsing otherwise.
  const topBarClass = tripStarted
    ? "bg-[#10b981]"
    : acceptedRide
      ? "bg-[#f59e0b]"
      : "bg-black animate-pulse";

  // ── Load current user id + real stats ─────────────────────────────────────
  useEffect(() => {
    getSession().then(async (session) => {
      if (!session?.user?.id) return;
      const uid = session.user.id;
      setUserId(uid);

      const vehicleProfile = await getDriverVehicleProfile(uid);
      const ready = Boolean(vehicleProfile.vehicle?.trim() && vehicleProfile.vehicle_type?.trim());
      setVehicleReady(ready);

      // Sync saved status back to Supabase on mount (in case it differs).
      // Missing vehicle data always forces OFFLINE until the profile is completed.
      const saved = (localStorage.getItem("uni_lift_driver_status") as DriverStatus) ?? "OFFLINE";
      const statusToSync = ready ? saved : "OFFLINE";
      if (!ready && saved !== "OFFLINE") {
        localStorage.setItem("uni_lift_driver_status", "OFFLINE");
        setDriverStatus("OFFLINE");
        setStatusNotice("Complete vehicle model and type in Profile before going online.");
      }
      await updateDriverStatus(uid, statusToSync);

      // Fetch real stats for today
      const stats = await getDriverStats(uid);
      setTodayRides(stats.totalRidesToday);
      setTodayEarnings(stats.earningsToday);
    });
  }, []);

  // ── Subscribe to live searching rides only when taking orders ─────────────
  useEffect(() => {
    if (driverStatus !== "TAKING_ORDERS") {
      setRides([]);
      return undefined;
    }

    setSkipped(new Set());
    const unsub = subscribeToSearchingRides((incoming) => setRides(incoming));
    return unsub;
  }, [driverStatus]);

  // ── Cooldown countdown ticker ─────────────────────────────────────────────
  useEffect(() => {
    if (proposeCooldownUntil === 0) return undefined;
    const tick = () => {
      const secsLeft = Math.ceil((proposeCooldownUntil - Date.now()) / 1000);
      if (secsLeft <= 0) { setProposeCooldownUntil(0); setProposeCooldownSecs(0); }
      else { setProposeCooldownSecs(secsLeft); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [proposeCooldownUntil]);

  // ── Subscribe to acceptedRide cancellation (rider cancelled after match) ──
  useEffect(() => {
    if (!acceptedRide) return undefined;
    const unsub = subscribeToRide(acceptedRide.id, (rideUpdate) => {
      if (!rideUpdate) return;
      if (rideUpdate.status === "CANCELLED") {
        setAcceptedRide(null);
        setTripStarted(false);
        onTripComplete?.();
        toast.error("Rider cancelled the ride.");
      }
    });
    return unsub;
  }, [acceptedRide?.id]);

  // ── Sync driver status to Supabase when it changes ───────────────────────
  const handleStatusChange = async (newStatus: DriverStatus) => {
    if (newStatus !== "OFFLINE" && !vehicleReady) {
      setStatusNotice("Complete vehicle model and type in Profile before going online.");
      return;
    }

    setStatusNotice("");
    setDriverStatus(newStatus);
    // Persist so status survives page refresh
    localStorage.setItem("uni_lift_driver_status", newStatus);
    if (userId) {
      await updateDriverStatus(userId, newStatus);
    }
    if (newStatus === "OFFLINE") {
      driver_goOffline();
    }
  };

  // ── Cycle through statuses ────────────────────────────────────────────────
  const cycleStatus = () => {
    const next = STATUS_CONFIG[driverStatus].next;
    handleStatusChange(next);
  };

  // ── Accept ride using rider-set fare ──────────────────────────────────────
  const handleAcceptRide = async (ride: SearchingRide) => {
    if (!userId || accepting) return;
    setAccepting(ride.id);
    const { error } = await acceptRiderPricedRide(ride.id, userId);
    if (error) {
      console.error("[acceptRide] Supabase error:", error.message);
      toast.error(`Could not accept ride. ${error.message}`);
      setAccepting(null);
      return;
    }

    setAcceptedRide({
      id: ride.id,
      pickup: ride.pickup,
      dropoff: ride.dropoff,
      fare: ride.fare,
      passenger_count: ride.passenger_count ?? 1,
      pickup_lat: ride.pickup_lat,
      pickup_lng: ride.pickup_lng,
      dropoff_lat: ride.dropoff_lat,
      dropoff_lng: ride.dropoff_lng,
    });
    setSkipped((prev) => new Set([...prev, ride.id]));
    onInspect?.(ride);
    useRideLifecycle.getState().driver_acceptRide();
    setAccepting(null);
  };

  const handleSkip = (id: string) => {
    setSkipped((prev) => new Set([...prev, id]));
  };

  // ── Propose a counter-fare ────────────────────────────────────────────────
  const handleProposeFare = async (ride: SearchingRide, fare: number) => {
    if (!userId || proposingForRide) return;
    if (Date.now() < proposeCooldownUntil) {
      toast.error(`Wait ${proposeCooldownSecs}s before proposing again.`);
      return;
    }
    setProposingForRide(ride.id);
    const { error } = await proposeFare(ride.id, userId, fare);
    if (error) {
      toast.error(`Could not propose fare: ${error.message}`);
      setProposingForRide(null);
      return;
    }
    setSkipped((prev) => new Set([...prev, ride.id]));
    setPendingProposal({ ride, proposedFare: fare });
    setProposeCooldownUntil(Date.now() + PROPOSE_COOLDOWN_MS);
    setProposingForRide(null);
  };

  // ── Withdraw a pending proposal ───────────────────────────────────────────
  const handleWithdrawProposal = async () => {
    if (!pendingProposal) return;
    // Restore original rider fare so other drivers see the correct price
    await resetFareProposal(pendingProposal.ride.id, pendingProposal.ride.fare);
    setPendingProposal(null);
  };

  // ── Subscribe to pending proposal ride to detect rider accept/decline ─────
  useEffect(() => {
    if (!pendingProposal) return undefined;
    const rideId = pendingProposal.ride.id;
    const unsub = subscribeToRide(rideId, async (rideUpdate) => {
      if (!rideUpdate) return;
      if (rideUpdate.status === "ACCEPTED" && rideUpdate.driver_id === userId) {
        // Rider accepted — transition to accepted-ride flow at the proposed fare
        const r = pendingProposal.ride;
        setAcceptedRide({
          id: rideId,
          pickup: r.pickup,
          dropoff: r.dropoff,
          fare: pendingProposal.proposedFare,
          passenger_count: r.passenger_count ?? 1,
          pickup_lat: r.pickup_lat,
          pickup_lng: r.pickup_lng,
          dropoff_lat: r.dropoff_lat,
          dropoff_lng: r.dropoff_lng,
        });
        onInspect?.(r);
        useRideLifecycle.getState().driver_acceptRide();
        setPendingProposal(null);
        toast.success("Rider accepted your fare!");
      } else if (rideUpdate.status === "SEARCHING") {
        // Rider declined — restore original fare then un-skip so feed shows correct price
        const rid = pendingProposal.ride.id;
        const originalFare = pendingProposal.ride.fare;
        setPendingProposal(null);
        await resetFareProposal(rid, originalFare);
        setSkipped((prev) => { const next = new Set(prev); next.delete(rid); return next; });
        toast("Rider declined your offer — ride is back on the board.");
      } else if (rideUpdate.status === "CANCELLED") {
        // Rider cancelled the ride entirely
        setPendingProposal(null);
        toast.error("Rider cancelled the ride.");
      }
    });
    return unsub;
  }, [pendingProposal?.ride.id, userId]);

  // ── Handle START TRIP ─────────────────────────────────────────────────────
  const handleStartTrip = async () => {
    if (!acceptedRide || startingTrip) return;
    setStartingTrip(true);
    const { error } = await startTrip(acceptedRide.id);
    if (!error) {
      setTripStarted(true);
      onTripStart?.();
      useRideLifecycle.getState().driver_arrivedAtPickup(); // advance driver phase
    } else {
      console.error("[startTrip] error:", error.message);
      toast.error(`Could not start trip: ${error.message}`);
    }
    setStartingTrip(false);
  };

  // ── Handle END TRIP ───────────────────────────────────────────────────────
  const handleEndTrip = async () => {
    if (!acceptedRide || endingTrip) return;
    setEndingTrip(true);
    const { error } = await completeTrip(acceptedRide.id);
    if (!error) {
      // Advance store phase to TRIP_SUMMARY
      useRideLifecycle.getState().driver_completeTrip();
      // Refresh today's stats
      if (userId) {
        const stats = await getDriverStats(userId);
        setTodayRides(stats.totalRidesToday);
        setTodayEarnings(stats.earningsToday);
      }
      setTripEnded(true);
      setDriverRating(0);
      setRatingTags([]);
      setRatingSaved(false);
      setTripStarted(false);
      onTripComplete?.(); // ← clear map in parent
    } else {
      console.error("[endTrip] error:", error.message);
      toast.error(`Could not end trip: ${error.message}`);
    }
    setEndingTrip(false);
  };

  // ── Handle SIMULATE TRIP (dev/local testing only) ─────────────────────────
  // Chains: START TRIP → 8 GPS broadcasts interpolated from pickup → dropoff → END TRIP.
  // Each GPS write fires the rider’s subscribeToRideGPS subscription so the pin moves.
  const handleSimulateTrip = async () => {
    if (!acceptedRide || simulatingTrip) return;
    setSimulatingTrip(true);

    // 1. Start the trip
    const { error: startErr } = await startTrip(acceptedRide.id);
    if (startErr) {
      console.error("[simulate] startTrip error:", startErr.message);
      setSimulatingTrip(false);
      return;
    }
    setTripStarted(true);
    onTripStart?.();
    useRideLifecycle.getState().driver_arrivedAtPickup();

    // 2. Broadcast GPS positions along the road network (OSRM) or fallback to linear
    const STEPS   = 40;
    const STEP_MS = 250; // ~10 s total
    const fromLat = acceptedRide.pickup_lat  ?? 10.2946;
    const fromLng = acceptedRide.pickup_lng  ?? 123.8823;
    const toLat   = acceptedRide.dropoff_lat ?? fromLat + 0.005;
    const toLng   = acceptedRide.dropoff_lng ?? fromLng + 0.005;

    const osrmPoints = await fetchOsrmRoute(fromLat, fromLng, toLat, toLng);
    const routePoints = osrmPoints
      ? sampleRoute(osrmPoints, STEPS)
      : Array.from({ length: STEPS }, (_, i) => {
          const t = (i + 1) / STEPS;
          return { lat: fromLat + (toLat - fromLat) * t, lng: fromLng + (toLng - fromLng) * t };
        });

    for (let i = 0; i < routePoints.length; i++) {
      // Abort GPS broadcast if SOS becomes active mid-simulation
      if (sosActiveRef.current) {
        console.warn("[simulate] SOS active — aborting GPS broadcast");
        setSimulatingTrip(false);
        return;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, STEP_MS));
      const point = routePoints[i];
      await updateDriverGPS(acceptedRide.id, point.lat, point.lng);
      // Throttle map updates to every 4th step (~1 s interval) to prevent render thrash
      if (i % 4 === 0 || i === routePoints.length - 1) {
        onSimulationPosition?.(point);
      }
    }

    // 3. End the trip
    const { error: endErr } = await completeTrip(acceptedRide.id);
    if (!endErr) {
      useRideLifecycle.getState().driver_completeTrip();
      if (userId) {
        const stats = await getDriverStats(userId);
        setTodayRides(stats.totalRidesToday);
        setTodayEarnings(stats.earningsToday);
      }
      setTripEnded(true);
      setTripStarted(false);
      onTripComplete?.(); // ← clear map in parent
    } else {
      console.error("[simulate] completeTrip error:", endErr.message);
    }
    setSimulatingTrip(false);
  };

  // Show trip ended / summary panel
  if (tripEnded && acceptedRide) {
    return (
      <aside className="w-[270px] shrink-0 border-r border-[#e5e7eb] flex flex-col overflow-hidden bg-white">
        <div className={`h-1 w-full ${topBarClass}`} />
        <div className="p-4 border-b border-[#e5e7eb] shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-2 rounded-full bg-[#10b981]" />
            <span className="font-mono text-[9px] text-[#10b981] tracking-[1px]">TRIP COMPLETED</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <div className="size-16 bg-[#d1fae5] rounded-full flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14L11 19L22 8" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-mono text-[11px] text-black text-center">Ride completed!</p>
          <div className="w-full border border-[#e5e7eb] p-3">
            <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-1">FARE EARNED</p>
            <p className="font-mono text-[22px] text-black">₱{acceptedRide.fare}</p>
          </div>
          <div className="w-full grid grid-cols-2 gap-2">
            <div className="border border-[#e5e7eb] p-2 text-center">
              <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px]">TODAY</p>
              <p className="font-mono text-[16px] text-black">{todayRides}</p>
            </div>
            <div className="border border-[#e5e7eb] p-2 text-center">
              <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px]">EARNED</p>
              <p className="font-mono text-[14px] text-black">₱{todayEarnings}</p>
            </div>
          </div>
          <div className="w-full border border-[#e5e7eb] p-3">
            <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-2">RATE RIDER</p>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setDriverRating(star)}
                  className={`text-[18px] leading-none ${star <= driverRating ? "text-[#f59e0b]" : "text-[#d1d5dc]"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {DRIVER_RATING_TAGS.map((tag) => {
                const selected = ratingTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() =>
                      setRatingTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
                    }
                    className={`px-2 py-1 border font-mono text-[7px] tracking-[0.4px] ${selected ? "bg-black text-white border-black" : "text-[#6a7282] border-[#d1d5dc]"}`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <button
              disabled={driverRating === 0 || ratingSaving || ratingSaved}
              onClick={async () => {
                if (driverRating === 0 || ratingSaving || ratingSaved) return;
                setRatingSaving(true);
                const { error } = await submitDriverRiderRating(acceptedRide.id, driverRating, ratingTags);
                if (!error) setRatingSaved(true);
                setRatingSaving(false);
              }}
              className="w-full h-[30px] bg-black font-mono text-[8px] text-white tracking-[0.5px] disabled:opacity-50"
            >
              {ratingSaved ? "RIDER RATED ✓" : ratingSaving ? "SAVING..." : "SUBMIT RIDER RATING"}
            </button>
          </div>
        </div>
        <div className="p-4 border-t border-[#e5e7eb] shrink-0">
          <button
            onClick={() => {
              setAcceptedRide(null);
              setTripEnded(false);
              setTripStarted(false);
              useRideLifecycle.getState().driver_resetAfterSummary();
            }}
            className="w-full h-[40px] bg-black font-mono text-[10px] text-white tracking-[0.5px] hover:bg-gray-900 transition-colors"
          >
            BACK TO REQUESTS
          </button>
        </div>
      </aside>
    );
  }

  // Show trip-in-progress panel
  if (tripStarted && acceptedRide) {
    return (
      <aside className="w-[270px] shrink-0 border-r border-[#e5e7eb] flex flex-col overflow-hidden bg-white">
        <div className={`h-1 w-full ${topBarClass}`} />
        <div className="p-4 border-b border-[#e5e7eb] shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="font-mono text-[9px] text-[#10b981] tracking-[1px]">TRIP IN PROGRESS</span>
          </div>
          <p className="font-mono text-[11px] text-black mb-0.5">En route to destination</p>
          <p className="font-mono text-[8px] text-[#6a7282] truncate">{acceptedRide.dropoff}</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
          <div className="size-16 bg-[#d1fae5] rounded-full flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 4L4 10V22H11V16H17V22H24V10L14 4Z" stroke="#10b981" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-mono text-[10px] text-[#6a7282] text-center tracking-wide">
            GPS is broadcasting your location to the rider
          </p>
          <div className="w-full border border-[#e5e7eb] p-3">
            <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-1">FARE</p>
            <p className="font-mono text-[22px] text-black">₱{acceptedRide.fare}</p>
          </div>
          <div className="w-full border border-[#e5e7eb] p-3">
            <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-1">PASSENGERS</p>
            <p className="font-mono text-[22px] text-black">{acceptedRide.passenger_count}</p>
          </div>
        </div>
        {/* SOS — driver can trigger or receive alerts during an active trip */}
        <SOSButton rideId={acceptedRide.id} viewerRole="DRIVER" onSOSActive={setSosActive} />

        {/* SOS Active Banner — freezes ride controls */}
        {sosActive && (
          <div className="shrink-0 bg-[#ef4444] px-4 py-3 flex items-center gap-2">
            <div className="size-2 rounded-full bg-white animate-ping" />
            <span className="font-mono text-[10px] text-white tracking-[1px] font-bold">
              ⚠ SOS ACTIVE — CONTROLS FROZEN
            </span>
          </div>
        )}
        {/* END TRIP — driver presses when rider has been dropped off */}
        <div className="p-4 border-t border-[#e5e7eb] shrink-0 flex flex-col gap-2">
          <button
            onClick={handleEndTrip}
            disabled={endingTrip || simulatingTrip || sosActive}
            className="w-full h-[44px] bg-[#10b981] flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M7 2L12 7L7 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-mono text-[11px] text-white tracking-[0.5px]">
              {endingTrip ? "ENDING..." : sosActive ? "SOS ACTIVE..." : "END TRIP"}
            </span>
          </button>
          {/* DEV-ONLY: immediately end trip */}
          <button
            onClick={handleEndTrip}
            disabled={endingTrip || simulatingTrip || sosActive}
            className="w-full h-[32px] border border-dashed border-[#f59e0b] flex items-center justify-center gap-1.5 hover:bg-[#fef3c7] transition-colors disabled:opacity-40"
          >
            <span className="font-mono text-[9px] text-[#92400e] tracking-[0.5px]">
              ⚡ FORCE END (DEV)
            </span>
          </button>
          <p className="font-mono text-[7px] text-[#99a1af] text-center tracking-[0.5px]">
            Only press when rider has been dropped off
          </p>
        </div>
      </aside>
    );
  }

  // Show accepted-but-not-started panel (EN ROUTE TO PICKUP)
  if (acceptedRide && !tripStarted) {
    return (
      <aside className="w-[270px] shrink-0 border-r border-[#e5e7eb] flex flex-col overflow-hidden bg-white">
        <div className={`h-1 w-full ${topBarClass}`} />
        <div className="p-4 border-b border-[#e5e7eb] shrink-0">
          <p className="font-mono text-[8px] text-[#99a1af] tracking-[2px] mb-1">RIDE ACCEPTED</p>
          <p className="font-mono text-[11px] text-black">En route to pickup</p>
        </div>
        <div className="flex-1 flex flex-col gap-3 p-4">
          <div className="border border-[#e5e7eb] p-3">
            <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-2">ROUTE</p>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="size-2 rounded-full border-2 border-[#2563eb]" />
              <p className="font-mono text-[9px] text-[#6a7282] truncate">{acceptedRide.pickup}</p>
            </div>
            <div className="w-px h-3 bg-[#e5e7eb] ml-[3px] my-0.5" />
            <div className="flex items-center gap-2">
              <div className="size-2 bg-[#ef4444] rounded-sm" />
              <p className="font-mono text-[9px] text-black truncate">{acceptedRide.dropoff}</p>
            </div>
          </div>
          <div className="border border-[#e5e7eb] p-3">
            <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-1">FARE</p>
            <p className="font-mono text-[22px] text-black">₱{acceptedRide.fare}</p>
          </div>
          <div className="border border-[#e5e7eb] p-3">
            <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-1">PASSENGERS</p>
            <p className="font-mono text-[22px] text-black">{acceptedRide.passenger_count}</p>
          </div>
        </div>
        {/* START TRIP — driver only */}
        <div className="p-4 border-t border-[#e5e7eb] shrink-0 flex flex-col gap-2">
          <button
            onClick={handleStartTrip}
            disabled={startingTrip || simulatingTrip}
            className="w-full h-[44px] bg-black flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 3L11 7L4 11V3Z" fill="white" />
            </svg>
            <span className="font-mono text-[11px] text-white tracking-[0.5px]">
              {startingTrip ? "STARTING..." : "START TRIP"}
            </span>
          </button>
          {/* DEV-ONLY: simulate full trip without real GPS */}
          <button
            onClick={handleSimulateTrip}
            disabled={simulatingTrip || startingTrip}
            className="w-full h-[36px] border border-dashed border-[#f59e0b] flex items-center justify-center gap-1.5 hover:bg-[#fef3c7] transition-colors disabled:opacity-40"
          >
            <span className="font-mono text-[9px] text-[#92400e] tracking-[0.5px]">
              {simulatingTrip ? "⚡ SIMULATING..." : "⚡ SIMULATE TRIP (DEV)"}
            </span>
          </button>
          <p className="font-mono text-[7px] text-[#99a1af] text-center tracking-[0.5px]">
            Only press when rider is onboard
          </p>
        </div>
      </aside>
    );
  }

  // ── Pending proposal waiting panel ────────────────────────────────────────
  if (pendingProposal && !acceptedRide) {
    const r = pendingProposal.ride;
    return (
      <aside className="w-[270px] shrink-0 border-r border-[#e5e7eb] flex flex-col overflow-hidden bg-white">
        <div className="h-1 w-full bg-[#f59e0b]" />
        <div className="p-4 border-b border-[#e5e7eb] shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-2 rounded-full bg-[#f59e0b] animate-pulse" />
            <span className="font-mono text-[9px] text-[#92400e] tracking-[1px]">FARE PROPOSED</span>
          </div>
          <p className="font-mono text-[11px] text-black">Waiting for rider response…</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <div className="size-16 bg-[#fef3c7] rounded-full flex items-center justify-center">
            <span className="font-mono text-[28px]">₱</span>
          </div>
          <div className="text-center">
            <p className="font-mono text-[9px] text-[#99a1af] tracking-[1px] mb-1">YOUR OFFER</p>
            <p className="font-mono text-[32px] text-black font-bold leading-none">₱{pendingProposal.proposedFare}</p>
            <p className="font-mono text-[8px] text-[#99a1af] mt-1">
              Rider set ₱{r.fare}
            </p>
          </div>
          <div className="w-full border border-[#e5e7eb] p-3">
            <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-2">ROUTE</p>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="size-2 rounded-full border-2 border-[#2563eb]" />
              <p className="font-mono text-[9px] text-[#6a7282] truncate">{r.pickup}</p>
            </div>
            <div className="w-px h-3 bg-[#e5e7eb] ml-[3px] my-0.5" />
            <div className="flex items-center gap-2">
              <div className="size-2 bg-[#ef4444] rounded-sm" />
              <p className="font-mono text-[9px] text-black truncate">{r.dropoff}</p>
            </div>
          </div>
          <p className="font-mono text-[8px] text-[#99a1af] text-center tracking-[0.4px]">
            Rider will accept or decline your offer
          </p>
        </div>
        <div className="p-4 border-t border-[#e5e7eb] shrink-0">
          <button
            onClick={handleWithdrawProposal}
            className="w-full h-[40px] border border-[#ef4444] font-mono text-[10px] text-[#ef4444] tracking-[0.5px] hover:bg-[#ef4444] hover:text-white transition-colors"
          >
            WITHDRAW OFFER
          </button>
        </div>
      </aside>
    );
  }

  // Default: only hide if truly mid-trip and not in our custom panels
  const isMidTrip = false; // handled above with acceptedRide panels

  const visibleRides = rides.filter((r) => !skipped.has(r.id));
  const cfg = STATUS_CONFIG[driverStatus];

  return (
    <aside className="w-[270px] shrink-0 border-r border-[#e5e7eb] flex flex-col overflow-hidden bg-white">
      <div className={`h-1 w-full ${topBarClass}`} />

      {/* Header */}
      <div className="p-3 border-b border-[#e5e7eb] shrink-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-mono text-[8px] text-[#99a1af] tracking-[2px]">INCOMING RIDES</p>
          {/* 3-state presence pill */}
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${cfg.bg}`}>
            <div className={`size-1.5 rounded-full animate-pulse ${cfg.dot}`} />
            <span className={`font-mono text-[7px] ${cfg.text}`}>{cfg.label}</span>
          </div>
        </div>
        <p className="font-mono text-[11px] text-black">
          {driverStatus === "OFFLINE"
            ? "You are offline"
            : `${visibleRides.length} ride${visibleRides.length !== 1 ? "s" : ""} available`}
        </p>
      </div>

      {/* Driver stats strip — real data from Supabase */}
      <div className="flex border-b border-[#e5e7eb] shrink-0">
        <div className="flex-1 p-2.5 text-center border-r border-[#e5e7eb]">
          <p className="font-mono text-[16px] text-black">{todayRides}</p>
          <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px]">TODAY</p>
        </div>
        <div className="flex-1 p-2.5 text-center">
          <p className="font-mono text-[16px] text-black">₱{todayEarnings}</p>
          <p className="font-mono text-[7px] text-[#99a1af] tracking-[0.5px]">EARNED</p>
        </div>
      </div>

      {/* Scrollable request list */}
      <div className="flex-1 overflow-y-auto pt-2">
        {driverStatus === "OFFLINE" ? (
          <div className="flex flex-col items-center justify-center h-[140px] gap-2 px-4">
            <div className="size-8 rounded-full border-2 border-[#e5e7eb] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="#d1d5dc" strokeWidth="1.2" />
                <path d="M7 4V7.5L9 9" stroke="#d1d5dc" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="font-mono text-[9px] text-[#99a1af] tracking-[0.5px] text-center">
              GO ONLINE TO SEE REQUESTS
            </p>
          </div>
        ) : driverStatus === "ONLINE" ? (
          <div className="flex flex-col items-center justify-center h-[140px] gap-2 px-4">
            <div className="size-2 rounded-full bg-[#f59e0b]" />
            <p className="font-mono text-[9px] text-[#99a1af] tracking-[0.5px] text-center">
              PAUSED — Switch to Taking Orders to accept rides
            </p>
          </div>
        ) : visibleRides.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[140px] gap-2">
            <div className="size-8 rounded-full border-2 border-[#e5e7eb] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="#d1d5dc" strokeWidth="1.2" />
                <path d="M7 4V7.5L9 9" stroke="#d1d5dc" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="font-mono text-[9px] text-[#99a1af] tracking-[0.5px]">WAITING FOR RIDERS...</p>
          </div>
        ) : (
          visibleRides.map((r) => (
            <RequestCard
              key={r.id}
              ride={r}
              onAccept={handleAcceptRide}
              onSkip={handleSkip}
              onInspect={onInspect ?? (() => {})}
              onPropose={handleProposeFare}
              accepting={accepting === r.id}
              proposing={proposingForRide === r.id}
              proposeCoolingDown={proposeCooldownUntil > Date.now()}
              proposeCooldownSecs={proposeCooldownSecs}
            />
          ))
        )}
      </div>

      {/* 3-state presence toggle button */}
      <div className="p-3 border-t border-[#e5e7eb] shrink-0 flex flex-col gap-2">
        {statusNotice && (
          <div className="border border-[#f59e0b] bg-[#fef3c7] p-2">
            <p className="font-mono text-[8px] text-[#92400e] leading-snug">{statusNotice}</p>
          </div>
        )}
        {/* Status indicator row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={`size-2 rounded-full ${cfg.dot}`} />
            <span className="font-mono text-[8px] text-[#6a7282]">STATUS: {cfg.label}</span>
          </div>
        </div>
        {/* Cycle button */}
        <button
          onClick={cycleStatus}
          className={`w-full h-[32px] border font-mono text-[9px] tracking-[0.5px] transition-colors ${
            driverStatus === "TAKING_ORDERS"
              ? "border-[#f59e0b] text-[#92400e] hover:bg-[#fef3c7]"
              : driverStatus === "ONLINE"
              ? "border-[#ef4444] text-[#ef4444] hover:bg-red-50"
              : "border-[#10b981] text-[#065f46] hover:bg-[#d1fae5]"
          }`}
        >
          {cfg.nextLabel.toUpperCase()} →
        </button>
      </div>
    </aside>
  );
}
