import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Navigation } from "../../../shared/layout/Navigation";
import { CampusMap } from "../../../shared/components/map/CampusMap";
import { LocationSearchInput } from "../../../shared/components/LocationSearchInput";
import { useGeolocation } from "../../../shared/components/map/useGeolocation";
import { useRideLifecycle, RIDE_TYPE_PRICES } from "../../rides/hooks/useRideLifecycle";
import { RiderMatchingOverlay } from "../../rides/components/RiderMatchingOverlay";
import { DriverRequestFeed } from "../../rides/components/DriverRequestFeed";
import {
  cancelExistingSearchingRides,
  getSession,
  postRideRequest,
  subscribeToOnlineDrivers,
  subscribeToRide,
  subscribeToRideGPS,
} from "../../../shared/lib/supabase";

const toRideCoords = (ride, latKey, lngKey) => {
  const lat = ride?.[latKey];
  const lng = ride?.[lngKey];
  if (lat == null || lng == null) return null;
  return { lat, lng };
};

const buildDriverSnapshot = (driverId, onlineDrivers, fallbackDrivers) => {
  const driverProfile = onlineDrivers.find((driver) => driver.id === driverId);
  const name = driverProfile?.full_name ?? "Driver";
  const initials = name.split(" ").map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase();
  const fallback = fallbackDrivers.get(name.toLowerCase());
  const vehicle = driverProfile?.vehicle ?? fallback?.vehicle ?? "Vehicle info unavailable";
  const plate = vehicle.includes("·") ? vehicle.split("·")[1].trim() : "—";

  return {
    id: driverId,
    name,
    initials,
    vehicle,
    plate,
    rating: driverProfile?.rating ?? fallback?.rating ?? 4.5,
    phone: "+63 900 000 0000",
    etaMinutes: 3,
    distanceKm: 0.5,
  };
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ACTIVE_DRIVERS = [
  { id: "MR", name: "Marcus Rivera",  vehicle: "Honda Click 150i · YZA 4521", type: "MOTO",    rating: 4.8, distance: "0.3 km", price: "30 (gas)", status: "ACTIVE", statusColor: "bg-[#10b981]" },
  { id: "KS", name: "Kyla Santos",    vehicle: "Toyota Wigo · ABC 1234",       type: "CAR",     rating: 4.5, distance: "0.7 km", price: "50",       status: "ACTIVE", statusColor: "bg-[#10b981]" },
  { id: "DR", name: "Diego Reyes",    vehicle: "Yamaha NMAX 155 · XYZ 8999",  type: "MOTO",    rating: 4, distance: "1.2 km", price: "25 (gas)", status: "ACTIVE", statusColor: "bg-[#10b981]" },
  { id: "AC", name: "Anne Cruz",      vehicle: "Honda XRM Sidecar · DEF 5678",type: "SIDECAR", rating: 4.5, distance: "1.8 km", price: "40",       status: "BUSY",   statusColor: "bg-[#f59e0b]" },
];

const RECENT_RIDES = [
  { from: "Science Block", to: "SM City",     driver: "Diego Reyes", time: "yesterday", price: "FREE" },
  { from: "Library",       to: "Dorm Block A", driver: "Kyla Santos", time: "yesterday", price: "₱50"  },
];

const QUICK_DESTINATIONS = ["Main Campus Plaza", "Engineering Block", "Science Building", "Library"];

const DRIVER_STATUS_META = {
  TAKING_ORDERS: { label: "TAKING ORDERS", dot: "bg-[#10b981]" },
  ONLINE: { label: "ONLINE", dot: "bg-[#f59e0b]" },
  OFFLINE: { label: "OFFLINE", dot: "bg-[#9ca3af]" },
};

const FALLBACK_DISTANCE_KM = 0.5;

const toRadians = (value) => (value * Math.PI) / 180;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getDistanceKm = (from, to) => {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return FALLBACK_DISTANCE_KM;

  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(0.1, earthRadiusKm * c);
};

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
  const [pickup, setPickup] = useState("CIT-U Main Gate");
  const [destination, setDestination] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("ALL");
  const [destCoords, setDestCoords] = useState(null);
  // Default to CIT-U Main Gate coordinates so routing works immediately
  const [pickupCoords, setPickupCoords] = useState({ lat: 10.2941, lng: 123.8818 });
  const { effectiveCoords } = useGeolocation();
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  // Which ride the driver is inspecting (for map route preview)
  const [inspectRide, setInspectRide] = useState(null);
  // Driver trip active flag — used to switch map to AnimatedRoute on driver side
  const [driverTripActive, setDriverTripActive] = useState(false);
  // Driver simulation position — moves amber car marker on driver's map during simulate
  const [driverSimPos, setDriverSimPos] = useState(null);

  // Stable callbacks for DriverRequestFeed — prevent re-render cascade from inline arrows
  const handleDriverInspect      = useCallback((ride) => setInspectRide(ride), []);
  const handleDriverTripStart    = useCallback(() => setDriverTripActive(true), []);
  const handleDriverSimPos       = useCallback((pos) => setDriverSimPos(pos), []);
  const handleDriverTripComplete = useCallback(() => {
    setInspectRide(null);
    setDriverGPS(null);
    setDriverTripActive(false);
    setDriverSimPos(null);
  }, []);

  // Stable memoized inspect coords — prevent AnimatedRoute from re-fetching OSRM on every render
  const inspectPickupCoords = useMemo(
    () => toRideCoords(inspectRide, "pickup_lat", "pickup_lng"),
    [inspectRide]
  );
  const inspectDestCoords = useMemo(
    () => toRideCoords(inspectRide, "dropoff_lat", "dropoff_lng"),
    [inspectRide]
  );
  // Live driver GPS during IN_TRANSIT (rider side)
  const [driverGPS, setDriverGPS] = useState(null);
  const smoothDriverGPSRef = useRef({
    rafId: null,
    startTime: 0,
    duration: 0,
    startPos: null,
    targetPos: null,
    currentPos: null,
    lastUpdate: 0,
  });
  const [passengerCount, setPassengerCount] = useState(1);
  const [riderFare, setRiderFare] = useState(String(RIDE_TYPE_PRICES.HABAL));
  

  const {
    appMode,
    rider,
    setAppMode,
    rider_cancelSearch,
    rider_completeTrip,
    rider_onDriverFound,
    rider_onFareProposed,
    rider_selectRideType,
    rider_setActiveRideId,
    rider_startSearching,
    rider_startTrip,
  } = useRideLifecycle();
  const isDriver = appMode === "DRIVER";
  const [isPostingRide, setIsPostingRide] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToOnlineDrivers((drivers) => setOnlineDrivers(drivers));
    return unsubscribe;
  }, []);

  const resetDriverGPSSmoothing = () => {
    const ref = smoothDriverGPSRef.current;
    if (ref.rafId != null) cancelAnimationFrame(ref.rafId);
    ref.rafId = null;
    ref.startTime = 0;
    ref.duration = 0;
    ref.startPos = null;
    ref.targetPos = null;
    ref.currentPos = null;
    ref.lastUpdate = 0;
  };

  const animateDriverGPS = (timestamp) => {
    const ref = smoothDriverGPSRef.current;
    if (!ref.startPos || !ref.targetPos) {
      ref.rafId = null;
      return;
    }

    const elapsed = timestamp - ref.startTime;
    const t = ref.duration > 0 ? Math.min(1, elapsed / ref.duration) : 1;
    const eased = t * (2 - t);
    const next = {
      lat: ref.startPos.lat + (ref.targetPos.lat - ref.startPos.lat) * eased,
      lng: ref.startPos.lng + (ref.targetPos.lng - ref.startPos.lng) * eased,
    };

    ref.currentPos = next;
    setDriverGPS(next);

    if (t < 1) {
      ref.rafId = requestAnimationFrame(animateDriverGPS);
    } else {
      ref.startPos = ref.targetPos;
      ref.rafId = null;
    }
  };

  // Subscribe to driver GPS during active trip (rider sees smooth driver marker)
  useEffect(() => {
    if (rider.phase !== "TRIP_IN_PROGRESS" || !rider.activeRideId) return undefined;
    const unsub = subscribeToRideGPS(rider.activeRideId, (coords) => {
      if (!coords) return;
      const ref = smoothDriverGPSRef.current;
      const now = performance.now();

      if (!ref.currentPos) {
        ref.currentPos = coords;
        ref.startPos = coords;
        ref.targetPos = coords;
        ref.lastUpdate = now;
        setDriverGPS(coords);
        return;
      }

      const interval = ref.lastUpdate ? now - ref.lastUpdate : 1000;
      ref.lastUpdate = now;
      ref.startPos = ref.currentPos;
      ref.targetPos = coords;
      ref.startTime = now;
      ref.duration = clamp(interval, 400, 2500);

      if (ref.rafId == null) {
        ref.rafId = requestAnimationFrame(animateDriverGPS);
      }
    });
    return () => {
      unsub();
      resetDriverGPSSmoothing();
    };
  }, [rider.phase, rider.activeRideId]);

  // Clear all map state when the trip ends (RATING = trip just completed)
  useEffect(() => {
    if (rider.phase === "RATING" || rider.phase === "BOOKING") {
      setDriverGPS(null);
      resetDriverGPSSmoothing();
      setDestCoords(null);
      setDestination("");
      setInspectRide(null);
    }
  }, [rider.phase]);

  const handleFindDriver = async () => {
    if (isPostingRide) return;
    if (!destination) return;

    const session = await getSession();
    const riderId = session?.user?.id;
    if (!riderId) {
      toast.error("Please sign in before requesting a ride.");
      return;
    }

    setIsPostingRide(true);
    useRideLifecycle.getState().rider_setBookingDetails(pickup, destination);
    rider_selectRideType("HABAL");

    const riderName =
      typeof session?.user?.user_metadata?.full_name === "string"
        ? session.user.user_metadata.full_name
        : (session?.user?.email?.split("@")[0] ?? "Rider");

    await cancelExistingSearchingRides(riderId);

    const distanceKm = getDistanceKm(pickupCoords, destCoords);
    const parsedFare = Number.parseFloat(riderFare);
    if (Number.isNaN(parsedFare) || parsedFare <= 0) {
      toast.error("Please enter a valid fare amount.");
      setIsPostingRide(false);
      return;
    }

    const { data, error } = await postRideRequest({
      rider_id: riderId,
      rider_name: riderName,
      pickup,
      dropoff: destination,
      fare: parsedFare,
      distance_km: Number(distanceKm.toFixed(2)),
      ride_type: "HABAL",
      passenger_count: passengerCount,
      // scheduled_at removed — scheduling feature deprecated in frontend
      pickup_lat: pickupCoords?.lat,
      pickup_lng: pickupCoords?.lng,
      dropoff_lat: destCoords?.lat,
      dropoff_lng: destCoords?.lng,
    });

    if (error || !data?.id) {
      console.error("[ride] postRideRequest failed:", error?.message ?? error);
      setIsPostingRide(false);
      return;
    }

    rider_setActiveRideId(data.id);
    rider_startSearching();
    setIsPostingRide(false);
  };

  useEffect(() => {
    if (!rider.activeRideId) return undefined;

    const unsubscribe = subscribeToRide(rider.activeRideId, (ride) => {
      if (!ride) return;

      const lifecycle = useRideLifecycle.getState();

      // ── Driver proposed a fare (new negotiation flow) ─────────────────────
      if (ride.status === "FARE_PROPOSED" && ride.driver_id && ride.fare != null) {
        if (lifecycle.rider.phase === "SEARCHING") {
          rider_onFareProposed(buildDriverSnapshot(ride.driver_id, onlineDrivers, fallbackDrivers), ride.fare);
        }
      }

      // ── Rider accepted fare → DRIVER_FOUND (already handled locally in overlay)
      // ── Also handles legacy ACCEPTED without negotiation ─────────────────
      if (ride.status === "ACCEPTED" && ride.driver_id) {
        if (lifecycle.rider.phase === "SEARCHING") {
          // Legacy path: direct accept without fare negotiation
          rider_onDriverFound(buildDriverSnapshot(ride.driver_id, onlineDrivers, fallbackDrivers));
        }
        // If phase === "FARE_NEGOTIATION", acceptFare() already transitioned locally
      }

      if (ride.status === "IN_TRANSIT" && lifecycle.rider.phase === "DRIVER_FOUND") {
        rider_startTrip();
      }

      if (ride.status === "COMPLETED") {
        rider_completeTrip();
        rider_setActiveRideId(null);
      }

      if (ride.status === "CANCELLED") {
        rider_cancelSearch();
      }
    });

    return unsubscribe;
  }, [onlineDrivers, rider.activeRideId, rider_cancelSearch, rider_completeTrip, rider_onDriverFound, rider_onFareProposed, rider_setActiveRideId, rider_startTrip]);

  const fallbackDrivers = new Map(
    ACTIVE_DRIVERS.map((driver) => [driver.name.toLowerCase(), driver])
  );

  const filteredDrivers = onlineDrivers.reduce((acc, driver) => {
    const name = driver.full_name ?? "Driver";
    const fallback = fallbackDrivers.get(name.toLowerCase());
    const statusKey = driver.driver_status ?? "ONLINE";
    const statusMeta = DRIVER_STATUS_META[statusKey] ?? DRIVER_STATUS_META.ONLINE;
    const initials = name
      .split(" ")
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const driverType = (driver.vehicle_type ?? fallback?.type ?? "").toUpperCase();

    if (vehicleFilter !== "ALL" && driverType !== vehicleFilter) return acc;

    acc.push({
      id: driver.id ?? fallback?.id ?? initials,
      chatId: driver.id ?? "",
      name,
      initials,
      vehicle: driver.vehicle ?? fallback?.vehicle ?? "Vehicle info unavailable",
      rating: driver.rating ?? fallback?.rating ?? null,
      distance: fallback?.distance ?? "—",
      price: fallback?.price ?? "—",
      statusLabel: statusMeta.label,
      statusColor: statusMeta.dot,
    });
    return acc;
  }, []);

  return (
    <div className="h-screen flex flex-col bg-white font-mono overflow-hidden">
      <Navigation
        activePage="home"
        mode={appMode}
        onModeToggle={(targetMode) => setAppMode(targetMode)}
      />

      {/* Rider matching overlay — floats above everything during SEARCHING / DRIVER_FOUND */}
      <RiderMatchingOverlay />

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

        {/* Left Panel — Rider form OR Driver request feed based on appMode */}
        {isDriver ? (
          <DriverRequestFeed
            onInspect={handleDriverInspect}
            onTripStart={handleDriverTripStart}
            onSimulationPosition={handleDriverSimPos}
            onTripComplete={handleDriverTripComplete}
          />
        ) : (
        <aside className="w-[270px] shrink-0 border-r border-[#e5e7eb] flex flex-col overflow-y-auto">

          {/* Ride Request */}
          <div className="p-3 border-b border-[#e5e7eb]">
            <p className="font-mono text-[8px] text-[#99a1af] tracking-[2px] mb-3">RIDE REQUEST</p>

            {/* Pickup — autocomplete */}
            <LocationSearchInput
              label="PICKUP LOCATION"
              placeholder="Search pickup..."
              value={pickup}
              biasCoords={effectiveCoords}
              onSelect={(label, coords) => {
                setPickup(label);
                setPickupCoords(coords);
              }}
              onChange={(v) => { setPickup(v); if (!v) setPickupCoords(null); }}
              icon={<LocationIcon />}
              className="mb-2"
            />

            {/* Destination — autocomplete */}
            <LocationSearchInput
              label="DESTINATION"
              placeholder="Search destination..."
              value={destination}
              biasCoords={effectiveCoords}
              onSelect={(label, coords) => {
                setDestination(label);
                setDestCoords(coords);
              }}
              onChange={(v) => { setDestination(v); if (!v) setDestCoords(null); }}
              icon={<SearchIcon />}
              className="mb-2"
            />

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

            {/* Passenger Count */}
            <div className="mb-3">
              <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-1">PASSENGERS</p>
              <div className="flex items-center border border-[#d1d5dc] h-[32px]">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPassengerCount(n)}
                    className={`flex-1 h-full font-mono text-[9px] transition-colors ${
                      passengerCount === n ? "bg-black text-white" : "text-[#6a7282] hover:bg-gray-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Rider Fare */}
            <div className="mb-3">
              <p className="font-mono text-[7px] text-[#99a1af] tracking-[1px] mb-1">YOUR PRICE (PHP)</p>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#6a7282]">₱</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={riderFare}
                  onChange={(e) => setRiderFare(e.target.value)}
                  className="w-full h-[32px] pl-6 pr-2 border border-[#d1d5dc] font-mono text-[10px] text-black focus:outline-none focus:border-black"
                  placeholder="Set your fare"
                />
              </div>
            </div>

            {/* Find Driver */}
            <button
              onClick={handleFindDriver}
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
                key={`${ride.from}-${ride.to}-${ride.time}`}
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
        )}

        {/* Campus Map — places pickup (blue) and destination (red) pins + flyTo on select */}
        <main className="flex-1 relative overflow-hidden">
          <CampusMap
            pickup={pickupCoords}
            destination={destCoords}
            drivers={onlineDrivers}
            tripInProgress={rider.phase === "TRIP_IN_PROGRESS" || driverTripActive}
            tripDriverLocation={driverGPS}
            driverLocation={isDriver && driverSimPos ? driverSimPos : null}
            inspectPickup={inspectPickupCoords}
            inspectDestination={inspectDestCoords}
          />
        </main>

        {/* Right Panel – Active Drivers */}
        <aside className="w-[200px] shrink-0 border-l border-[#e5e7eb] flex flex-col overflow-hidden">

          {/* Header + Filter */}
          <div className="p-3 border-b border-[#e5e7eb]">
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[8px] text-[#99a1af] tracking-[2px]">ACTIVE DRIVERS</p>
              <div className="bg-[#10b981] px-1.5 py-0.5 flex items-center gap-1">
                <div className="size-1.5 rounded-full bg-white" />
                <span className="font-mono text-[7px] text-white">{filteredDrivers.length} LIVE</span>
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
            {filteredDrivers.length === 0 ? (
              <div className="p-3 text-center">
                <p className="font-mono text-[8px] text-[#99a1af] tracking-[0.5px]">
                  NO ONLINE DRIVERS
                </p>
              </div>
            ) : filteredDrivers.map((driver) => (
              <div key={driver.id} className="p-3 border-b border-[#f3f4f6]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-black size-8 flex items-center justify-center shrink-0">
                      <span className="font-mono text-[9px] text-white">{driver.initials}</span>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-black">{driver.name}</p>
                      <div className="flex items-center gap-1">
                        <div className={`size-1.5 rounded-full ${driver.statusColor}`} />
                        <span className="font-mono text-[7px] text-[#6a7282] tracking-[0.5px]">{driver.statusLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <StarIcon />
                    <span className="font-mono text-[8px] text-black">{driver.rating ?? "—"}</span>
                  </div>
                </div>

                <p className="font-mono text-[8px] text-[#6a7282] tracking-[0.2px] mb-1">{driver.vehicle}</p>

                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[8px] text-[#6a7282]">↗ {driver.distance}</span>
                  <span className="font-mono text-[8px] text-black">₱{driver.price}</span>
                </div>

                <button
                  onClick={() => navigate(`/messages/${driver.chatId || driver.id}`)}
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
