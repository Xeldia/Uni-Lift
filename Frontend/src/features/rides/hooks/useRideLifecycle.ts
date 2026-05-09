import { create } from "zustand";

// ════════════════════════════════════════════════════════════════════════════
// § 1. ENUMS & TYPES
// ════════════════════════════════════════════════════════════════════════════

/** Top-level toggle: which mode is the current user operating in. */
export type AppMode = "RIDER" | "DRIVER";

// ── Rider phases (sequential lifecycle) ─────────────────────────────────────
export type RiderPhase =
  | "ROLE_SELECT"       // Initial landing — choose Rider or Driver
  | "BOOKING"           // Selecting pickup / dropoff / ride type
  | "SEARCHING"         // Animated pulse ring — matching with a driver
  | "FARE_NEGOTIATION"  // Driver proposed a fare — rider sees Accept / Decline
  | "DRIVER_FOUND"      // Driver profile, live ETA countdown, call/message/cancel
  | "TRIP_IN_PROGRESS"  // Progress bar, fare display, driver info
  | "RATING";           // Star rating + tag chips after trip

// ── Driver phases (sequential lifecycle) ────────────────────────────────────
export type DriverPhase =
  | "ROLE_SELECT"           // Initial landing — choose Rider or Driver
  | "OFFLINE"               // Dashboard with stats and go-online toggle
  | "WAITING_FOR_RIDER"     // Live map, nearby riders, incoming request card
  | "EN_ROUTE_TO_PICKUP"    // Navigation to rider's pickup location
  | "TRIP_IN_PROGRESS"      // Active trip — fare display, ETA to dropoff
  | "TRIP_SUMMARY";         // Earnings recap, rating received from rider

// ── Ride types (shown during Rider BOOKING phase) ───────────────────────────
export type RideType = "HABAL" | "CAR" | "SHUTTLE" | "PREMIUM";

// ── Rating tags (shown during Rider RATING phase) ───────────────────────────
export type RatingTag = "Safe" | "On time" | "Friendly" | "Clean" | "Professional";
export const ALL_RATING_TAGS: RatingTag[] = ["Safe", "On time", "Friendly", "Clean", "Professional"];

// ── Incoming ride request (shown in Driver WAITING_FOR_RIDER feed) ───────────
export interface IncomingRideRequest {
  id: string;
  riderName: string;
  pickup: string;
  dropoff: string;
  fare: number;
  distanceKm: number;
  rideType: RideType;
  postedMinutesAgo: number;
}

// ── Live prices per ride type (mock — swap for Supabase pricing table later) ─
export const RIDE_TYPE_PRICES: Record<RideType, number> = {
  HABAL:   25,
  CAR:     55,
  SHUTTLE: 15,
  PREMIUM: 90,
};

// ── Mock driver snapshot (used when auto-matching in SEARCHING phase) ────────
export interface MatchedDriver {
  id: string;
  name: string;
  initials: string;
  vehicle: string;
  plate: string;
  rating: number;
  phone: string;
  etaMinutes: number;       // live countdown starts here
  distanceKm: number;
}

// ── Trip summary snapshot (populated when TRIP_IN_PROGRESS ends) ─────────────
export interface TripSummary {
  rideId: string | null;   // captured before activeRideId is cleared
  pickup: string;
  dropoff: string;
  rideType: RideType;
  fareAmount: number;
  durationMinutes: number;
  distanceKm: number;
}

// ── Driver earnings summary (shown in TRIP_SUMMARY phase) ───────────────────
export interface DriverEarnings {
  fareAmount: number;
  durationMinutes: number;
  distanceKm: number;
  riderRating: number;       // rating the rider gave the driver
}

// ── Rider-side state snapshot ────────────────────────────────────────────────
export interface RiderState {
  phase: RiderPhase;

  // BOOKING
  pickup: string;
  dropoff: string;
  selectedRideType: RideType | null;

  // DRIVER_FOUND & TRIP_IN_PROGRESS
  matchedDriver: MatchedDriver | null;
  etaSeconds: number;        // live countdown (seconds remaining)
  proposedFare: number | null; // set during FARE_NEGOTIATION phase

  // TRIP_IN_PROGRESS
  fareAmount: number;

  // RATING
  tripSummary: TripSummary | null;
  ratingStars: number;
  ratingTags: RatingTag[];

  // Active ride id — used by RiderMatchingOverlay to subscribe to DB row
  activeRideId: string | null;
}

// ── Driver-side state snapshot ───────────────────────────────────────────────
export interface DriverState {
  phase: DriverPhase;

  // OFFLINE / stats
  totalRidesToday: number;
  earningsToday: number;

  // WAITING_FOR_RIDER — incoming request
  pendingRiderName: string | null;
  pendingPickup: string | null;
  pendingDropoff: string | null;
  pendingFare: number | null;

  // TRIP_IN_PROGRESS
  activeRiderName: string | null;
  fareAmount: number;
  etaSeconds: number;

  // TRIP_SUMMARY
  tripSummary: DriverEarnings | null;
}

// ── Root state shape ─────────────────────────────────────────────────────────
interface LifecycleState {
  appMode: AppMode;
  rider: RiderState;
  driver: DriverState;
  _searchingTimer: ReturnType<typeof setTimeout> | null;

  // ── Shared Actions ──────────────────────────────────────────────────────
  setAppMode: (mode: AppMode) => void;

  // ── Rider Actions ───────────────────────────────────────────────────────
  rider_setBookingDetails: (pickup: string, dropoff: string) => void;
  rider_selectRideType: (type: RideType) => void;
  rider_setActiveRideId: (id: string | null) => void;   // stores the Supabase ride row id
  rider_startSearching: () => void;            // BOOKING → SEARCHING (auto-advances after 3s)
  rider_onDriverFound: (driver: MatchedDriver) => void; // SEARCHING → DRIVER_FOUND (called by timer)
  rider_cancelSearch: () => void;              // SEARCHING → BOOKING
  rider_startTrip: () => void;                 // DRIVER_FOUND → TRIP_IN_PROGRESS
  rider_completeTrip: () => void;              // TRIP_IN_PROGRESS → RATING
  rider_submitRating: (stars: number, tags: RatingTag[]) => void; // RATING → BOOKING (reset)
  rider_cancelRide: () => void;                // DRIVER_FOUND → BOOKING (cancel before pickup)
  // Fare negotiation
  rider_onFareProposed: (driver: MatchedDriver, fare: number) => void; // SEARCHING → FARE_NEGOTIATION
  rider_acceptFare: () => void;                // FARE_NEGOTIATION → DRIVER_FOUND
  rider_declineFare: () => void;               // FARE_NEGOTIATION → SEARCHING

  // ── Driver Actions ──────────────────────────────────────────────────────
  driver_goOnline: () => void;                 // OFFLINE → WAITING_FOR_RIDER
  driver_goOffline: () => void;                // any active phase → OFFLINE
  driver_acceptRide: () => void;               // WAITING_FOR_RIDER → EN_ROUTE_TO_PICKUP
  driver_declineRide: () => void;              // WAITING_FOR_RIDER → WAITING_FOR_RIDER (clears pending)
  driver_acceptAndMatchRider: (request: IncomingRideRequest) => void; // Same-tab cross-update (see §3)
  driver_arrivedAtPickup: () => void;          // EN_ROUTE_TO_PICKUP → TRIP_IN_PROGRESS
  driver_completeTrip: () => void;             // TRIP_IN_PROGRESS → TRIP_SUMMARY
  driver_resetAfterSummary: () => void;        // TRIP_SUMMARY → WAITING_FOR_RIDER

  // ── Chat Bridge ─────────────────────────────────────────────────────────
  // Called automatically by useChat.confirmOffer when a conversation hits AGREED.
  // Rider → DRIVER_FOUND, Driver → EN_ROUTE_TO_PICKUP.
  onChatAgreed: (driver: MatchedDriver) => void;
}

// ════════════════════════════════════════════════════════════════════════════
// § 2. MOCK DATA HELPERS
// ════════════════════════════════════════════════════════════════════════════

/** The first active mock driver — used as the auto-match result. */
const MOCK_MATCHED_DRIVER: MatchedDriver = {
  id: "MR",
  name: "Marcus Rivera",
  initials: "MR",
  vehicle: "Honda Click 150i",
  plate: "YZA 4521",
  rating: 4.8,
  phone: "+63 912 345 6789",
  etaMinutes: 3,
  distanceKm: 0.3,
};

const initialRider: RiderState = {
  phase: "ROLE_SELECT",
  pickup: "Current Location",
  dropoff: "",
  selectedRideType: null,
  matchedDriver: null,
  etaSeconds: 0,
  proposedFare: null,
  fareAmount: 0,
  tripSummary: null,
  ratingStars: 0,
  ratingTags: [],
  activeRideId: null,
};

const initialDriver: DriverState = {
  phase: "ROLE_SELECT",
  totalRidesToday: 0,
  earningsToday: 0,
  pendingRiderName: null,
  pendingPickup: null,
  pendingDropoff: null,
  pendingFare: null,
  activeRiderName: null,
  fareAmount: 0,
  etaSeconds: 0,
  tripSummary: null,
};

// ════════════════════════════════════════════════════════════════════════════
// § 3. ZUSTAND STORE
// ════════════════════════════════════════════════════════════════════════════

// Read persisted mode once at module load
const _savedMode = (localStorage.getItem("uni_lift_app_mode") as "RIDER" | "DRIVER") ?? "RIDER";

// Restore in-progress rider state so a refresh doesn't kill the ride
const _savedRiderPhase = (localStorage.getItem("uni_lift_rider_phase") as import("./useRideLifecycle").RiderPhase | null);
const _savedRideId     = localStorage.getItem("uni_lift_active_ride_id");
const _savedDriver     = (() => {
  try { return JSON.parse(localStorage.getItem("uni_lift_matched_driver") ?? "null"); } catch { return null; }
})();

/** Helpers to persist / clear rider progress */
const _saveRiderProgress = (phase: string, rideId: string | null, driver: unknown) => {
  localStorage.setItem("uni_lift_rider_phase", phase);
  localStorage.setItem("uni_lift_active_ride_id", rideId ?? "");
  localStorage.setItem("uni_lift_matched_driver", JSON.stringify(driver));
};
const _clearRiderProgress = () => {
  localStorage.removeItem("uni_lift_rider_phase");
  localStorage.removeItem("uni_lift_active_ride_id");
  localStorage.removeItem("uni_lift_matched_driver");
};

export const useRideLifecycle = create<LifecycleState>()((set, get) => ({
  appMode: _savedMode,
  rider: {
    ...initialRider,
    // Restore in-progress state if page was refreshed mid-ride
    phase: (_savedRiderPhase && _savedMode === "RIDER") ? _savedRiderPhase : _savedMode === "RIDER" ? "BOOKING" : "ROLE_SELECT",
    activeRideId: _savedRideId || null,
    matchedDriver: _savedDriver ?? null,
  },
  // If restoring as DRIVER, go straight to WAITING_FOR_RIDER so the feed is visible
  driver: { ...initialDriver, phase: _savedMode === "DRIVER" ? "WAITING_FOR_RIDER" : "ROLE_SELECT" },
  _searchingTimer: null,

  // ── Shared ───────────────────────────────────────────────────────────────
  setAppMode: (mode) => {
    // Persist so the chosen role survives a page refresh
    localStorage.setItem("uni_lift_app_mode", mode);
    set({
      appMode: mode,
      rider: { ...initialRider, phase: mode === "RIDER" ? "BOOKING" : "ROLE_SELECT" },
      driver: { ...initialDriver, phase: mode === "DRIVER" ? "WAITING_FOR_RIDER" : "ROLE_SELECT" },
    });
  },

  // ── Rider ─────────────────────────────────────────────────────────────────

  rider_setBookingDetails: (pickup, dropoff) =>
    set((s) => ({ rider: { ...s.rider, pickup, dropoff } })),

  rider_setActiveRideId: (id) => {
    if (id) localStorage.setItem("uni_lift_active_ride_id", id);
    set((s) => ({ rider: { ...s.rider, activeRideId: id } }));
  },

  rider_selectRideType: (type) =>
    set((s) => ({
      rider: {
        ...s.rider,
        selectedRideType: type,
        fareAmount: RIDE_TYPE_PRICES[type],
      },
    })),

  rider_startSearching: () => {
    // Guard: must have a destination and ride type selected
    const { rider } = get();
    if (!rider.dropoff || !rider.selectedRideType) return;

    // Clear any stale timer
    if (get()._searchingTimer) clearTimeout(get()._searchingTimer!);

    set((s) => ({ rider: { ...s.rider, phase: "SEARCHING" }, _searchingTimer: null }));

    // ── Real matching is handled by RiderMatchingOverlay ──────────────────
    // subscribeToRide(rider.activeRideId) fires rider_onDriverFound when
    // a driver accepts and the rides row status changes to IN_TRANSIT.
    // The old 3-second MOCK_MATCHED_DRIVER auto-fire has been removed.
  },

  rider_onDriverFound: (driver) => {
    set((s) => ({
      rider: {
        ...s.rider,
        phase: "DRIVER_FOUND",
        matchedDriver: driver,
        etaSeconds: driver.etaMinutes * 60,
      },
      _searchingTimer: null,
    }));
    // Persist so refresh restores the Driver Found card
    const state = get();
    _saveRiderProgress("DRIVER_FOUND", state.rider.activeRideId, driver);
  },

  rider_cancelSearch: () => {
    const timer = get()._searchingTimer;
    if (timer) clearTimeout(timer);
    _clearRiderProgress();
    set((s) => ({
      rider: { ...s.rider, phase: "BOOKING", activeRideId: null },
      _searchingTimer: null,
    }));
  },

  rider_startTrip: () => {
    const { rider } = get();
    _saveRiderProgress("TRIP_IN_PROGRESS", rider.activeRideId, rider.matchedDriver);
    set((s) => ({ rider: { ...s.rider, phase: "TRIP_IN_PROGRESS" } }));
  },

  rider_completeTrip: () => {
    const { rider } = get();
    _clearRiderProgress(); // trip over — clear persisted ride state
    const summary: TripSummary = {
      rideId: rider.activeRideId,     // capture before _clearRiderProgress nulls it
      pickup: rider.pickup,
      dropoff: rider.dropoff,
      rideType: rider.selectedRideType ?? "HABAL",
      fareAmount: rider.fareAmount,
      durationMinutes: 12,
      distanceKm: rider.matchedDriver?.distanceKm ?? 1.0,
    };
    set((s) => ({
      rider: {
        ...s.rider,
        phase: "RATING",
        tripSummary: summary,
        ratingStars: 0,
        ratingTags: [],
      },
    }));
  },

  rider_submitRating: (stars, tags) => {
    _clearRiderProgress(); // final cleanup after rating
    set((s) => ({
      rider: {
        ...initialRider,
        phase: "BOOKING",
        ratingStars: stars,
        ratingTags: tags,
      },
    }));
  },

  rider_cancelRide: () => {
    _clearRiderProgress();
    set((s) => ({
      rider: {
        ...initialRider,
        phase: "BOOKING",
        pickup: s.rider.pickup,    // preserve pickup location
      },
    }));
  },

  // ── Fare negotiation actions ─────────────────────────────────────────────────────────

  rider_onFareProposed: (driver, fare) => {
    set((s) => ({
      rider: {
        ...s.rider,
        phase: "FARE_NEGOTIATION",
        matchedDriver: driver,
        proposedFare: fare,
      },
    }));
    // Persist so a refresh mid-negotiation can restore the card
    const state = get();
    _saveRiderProgress("FARE_NEGOTIATION", state.rider.activeRideId, driver);
  },

  rider_acceptFare: () => {
    // Transition to DRIVER_FOUND with the already-stored matchedDriver
    const { rider } = get();
    const driver = rider.matchedDriver;
    if (!driver) return;
    set((s) => ({
      rider: {
        ...s.rider,
        phase: "DRIVER_FOUND",
        fareAmount: s.rider.proposedFare ?? 0,
        etaSeconds: (driver.etaMinutes ?? 3) * 60,
        proposedFare: null,
      },
    }));
    _saveRiderProgress("DRIVER_FOUND", rider.activeRideId, driver);
  },

  rider_declineFare: () => {
    // Go back to SEARCHING — ride re-advertises automatically via Supabase
    set((s) => ({
      rider: {
        ...s.rider,
        phase: "SEARCHING",
        matchedDriver: null,
        proposedFare: null,
      },
    }));
  },

  // ── Driver ────────────────────────────────────────────────────────────────

  driver_goOnline: () =>
    set((s) => ({ driver: { ...s.driver, phase: "WAITING_FOR_RIDER" } })),

  driver_goOffline: () => {
    // TODO: supabase.from('drivers').update({ is_online: false }).eq('id', driverId)
    set((s) => ({ driver: { ...initialDriver, phase: "OFFLINE" } }));
  },

  driver_acceptRide: () =>
    set((s) => ({ driver: { ...s.driver, phase: "EN_ROUTE_TO_PICKUP" } })),

  // ── TODO: SUPABASE REALTIME — Remove cross-update when implementing WebSockets ──
  // In production: Driver's acceptance triggers a Supabase DB write, which fires a
  // Realtime broadcast to the Rider's device, advancing their phase remotely.
  // For now (same-tab demo): we directly mutate both sides of the shared store.
  driver_acceptAndMatchRider: (request) => {
    // Cancel any stale searching timer
    const timer = get()._searchingTimer;
    if (timer) clearTimeout(timer);

    set((s) => ({
      _searchingTimer: null,
      // Advance Driver → EN_ROUTE_TO_PICKUP
      driver: {
        ...s.driver,
        phase: "EN_ROUTE_TO_PICKUP",
        pendingRiderName: request.riderName,
        pendingPickup: request.pickup,
        pendingDropoff: request.dropoff,
        pendingFare: request.fare,
        fareAmount: request.fare,
        activeRiderName: request.riderName,
        etaSeconds: 180,
      },
      // NOTE: Do NOT update rider state here.
      // The rider is on a different device/tab and gets notified via
      // Supabase Realtime (subscribeToRide in HomePage.jsx fires
      // rider_onDriverFound when rides.status changes to ACCEPTED).
    }));
  },
  // ───────────────────────────────────────────────────────────────────────────

  driver_declineRide: () =>
    set((s) => ({
      driver: {
        ...s.driver,
        phase: "WAITING_FOR_RIDER",
        pendingRiderName: null,
        pendingPickup: null,
        pendingDropoff: null,
        pendingFare: null,
      },
    })),

  driver_arrivedAtPickup: () =>
    set((s) => ({ driver: { ...s.driver, phase: "TRIP_IN_PROGRESS" } })),

  driver_completeTrip: () => {
    const { driver } = get();
    const summary: DriverEarnings = {
      fareAmount: driver.fareAmount,
      durationMinutes: 12,          // mock — replace with actual elapsed time
      distanceKm: 1.0,
      riderRating: 4,               // mock — replace with actual rating from rider
    };
    // TODO: supabase.from('rides').update({ status: 'COMPLETED', completed_at: now() }).eq('id', rideId)
    set((s) => ({
      driver: {
        ...s.driver,
        phase: "TRIP_SUMMARY",
        tripSummary: summary,
        totalRidesToday: s.driver.totalRidesToday + 1,
        earningsToday: s.driver.earningsToday + summary.fareAmount,
      },
    }));
  },

  driver_resetAfterSummary: () =>
    set((s) => ({
      driver: {
        ...s.driver,
        phase: "WAITING_FOR_RIDER",
        tripSummary: null,
        pendingRiderName: null,
        pendingPickup: null,
        pendingDropoff: null,
        pendingFare: null,
        activeRiderName: null,
        fareAmount: 0,
        etaSeconds: 0,
      },
    })),

  // ── Chat Bridge ────────────────────────────────────────────────────────────
  // Automatically called when useChat.confirmOffer() resolves to AGREED.
  // Bridges the negotiation phase into the structured ride lifecycle.
  onChatAgreed: (driver) => {
    const { appMode } = get();

    if (appMode === "RIDER") {
      // Rider side: jump straight to DRIVER_FOUND with the agreed driver
      set((s) => ({
        rider: {
          ...s.rider,
          phase: "DRIVER_FOUND",
          matchedDriver: driver,
          etaSeconds: driver.etaMinutes * 60,
          fareAmount: driver.etaMinutes, // will be overridden by actual agreed price
        },
      }));
    }

    if (appMode === "DRIVER") {
      // Driver side: the Rider confirmed — move to EN_ROUTE_TO_PICKUP
      set((s) => ({
        driver: {
          ...s.driver,
          phase: "EN_ROUTE_TO_PICKUP",
          activeRiderName: "Rider",   // TODO: replace with actual rider name from ride_requests table
          etaSeconds: 180,            // mock 3-min ETA to pickup
        },
      }));
    }
  },
}));

// ════════════════════════════════════════════════════════════════════════════
// § 4. CHAT BRIDGE HELPER  (call this inside useChat.confirmOffer)
// ════════════════════════════════════════════════════════════════════════════
//
// Import and call this in useChat.ts after the AGREED state update:
//
//   import { useRideLifecycle, MOCK_MATCHED_DRIVER_FROM_CONV } from "./useRideLifecycle";
//
//   confirmOffer: async (convId, amount) => {
//     // ... existing chat state update ...
//
//     // ── LIFECYCLE BRIDGE: transition both Rider and Driver phases ──────────
//     const matchedDriver: MatchedDriver = {
//       id:         conv.id,
//       name:       conv.driverName,
//       initials:   conv.driverInitials,
//       vehicle:    conv.vehicle,
//       plate:      conv.plate,
//       rating:     conv.rating,
//       phone:      "+63 912 000 0000",   // TODO: fetch from users table
//       etaMinutes: 3,
//       distanceKm: parseFloat(conv.distance),
//     };
//     useRideLifecycle.getState().onChatAgreed(matchedDriver);
//     // ──────────────────────────────────────────────────────────────────────
//   }
