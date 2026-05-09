import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRideLifecycle, ALL_RATING_TAGS, type RatingTag } from "../hooks/useRideLifecycle";
import { cancelRide, submitRideRating, acceptFare, declineFare } from "../../../shared/lib/supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Stage config ─────────────────────────────────────────────────────────────
const STAGES = [
  { label: "Advertising ride...",  subtext: "Broadcasting to nearby drivers",   duration: 1400, done: false },
  { label: "Finding driver...",    subtext: "Matching based on your location",  duration: 1200, done: false },
  { label: "Driver found!",        subtext: "Your driver is on the way",        duration: 9999, done: true  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────
export function RiderMatchingOverlay() {
  const {
    rider, appMode,
    rider_cancelSearch, rider_cancelRide, rider_submitRating,
    rider_acceptFare, rider_declineFare,
  } = useRideLifecycle();

  // SEARCHING / DRIVER_FOUND
  const [stageIdx, setStageIdx]           = useState(0);
  const [etaSecondsLeft, setEtaLeft]      = useState(0);

  // RATING sub-phases
  const [showArrived, setShowArrived]     = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [hoveredStar, setHoveredStar]     = useState(0);
  const [selectedTags, setSelectedTags]   = useState<RatingTag[]>([]);
  const [submitting, setSubmitting]       = useState(false);
  const arrivedTimer                      = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Stage animation cycle ──────────────────────────────────────────────────
  useEffect(() => {
    if (rider.phase !== "SEARCHING") { setStageIdx(0); return; }
    setStageIdx(0);
    let current = 0;
    const advance = () => {
      current += 1;
      if (current < STAGES.length - 1) {
        setStageIdx(current);
        timerId = setTimeout(advance, STAGES[current].duration);
      }
    };
    let timerId = setTimeout(advance, STAGES[0].duration);
    return () => clearTimeout(timerId);
  }, [rider.phase]);

  // ── Snap to "Driver found!" stage ─────────────────────────────────────────
  useEffect(() => {
    if (rider.phase === "DRIVER_FOUND") setStageIdx(STAGES.length - 1);
  }, [rider.phase]);

  // ── ETA countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (rider.phase !== "DRIVER_FOUND" || !rider.matchedDriver) return;
    const startSecs = (rider.matchedDriver.etaMinutes ?? 3) * 60;
    setEtaLeft(startSecs);
    const id = setInterval(() => {
      setEtaLeft((prev) => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rider.phase]);

  // ── Arrived celebration ────────────────────────────────────────────────────
  useEffect(() => {
    if (rider.phase !== "RATING") return;
    setShowArrived(true);
    setSelectedStars(0);
    setSelectedTags([]);
    arrivedTimer.current = setTimeout(() => setShowArrived(false), 2500);
    return () => { if (arrivedTimer.current) clearTimeout(arrivedTimer.current); };
  }, [rider.phase]);

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (rider.activeRideId) await cancelRide(rider.activeRideId);
    if (rider.phase === "DRIVER_FOUND") {
      rider_cancelRide();
      return;
    }
    rider_cancelSearch();
  };

  // ── Rating submit ──────────────────────────────────────────────────────────
  const handleSubmitRating = async () => {
    if (submitting || selectedStars === 0) return;
    setSubmitting(true);
    const rideId = rider.tripSummary?.rideId;
    if (rideId) {
      await submitRideRating(rideId, selectedStars, selectedTags);
    }
    rider_submitRating(selectedStars, selectedTags);
    setSubmitting(false);
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (appMode === "DRIVER") return null;
  const phase = rider.phase;
  if (
    phase !== "SEARCHING" &&
    phase !== "FARE_NEGOTIATION" &&
    phase !== "DRIVER_FOUND" &&
    phase !== "TRIP_IN_PROGRESS" &&
    phase !== "RATING"
  ) return null;

  // ─── FARE NEGOTIATION ─────────────────────────────────────────────────────────
  if (phase === "FARE_NEGOTIATION") {
    const driver   = rider.matchedDriver;
    const proposed = rider.proposedFare;
    const rideId   = rider.activeRideId;

    const handleAccept = async () => {
      if (rideId) await acceptFare(rideId);
      rider_acceptFare();
    };
    const handleDecline = async () => {
      if (rideId) await declineFare(rideId);
      rider_declineFare();
    };

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-[440px] bg-white rounded-t-2xl shadow-2xl overflow-hidden">
          <div className="h-1 w-full bg-[#f59e0b]" />
          <div className="px-6 pt-5 pb-6">
            <p className="font-mono text-[9px] text-[#92400e] tracking-[2px] mb-0.5">FARE OFFER</p>
            <p className="font-mono text-[20px] text-black font-bold tracking-tight mb-4">Driver proposed a fare</p>
            {driver && (
              <div className="border border-[#e5e7eb] rounded-xl p-3 mb-4 flex items-center gap-3">
                <div className="size-10 bg-black rounded-full flex items-center justify-center shrink-0">
                  <span className="font-mono text-[11px] text-white">{driver.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[11px] text-black font-semibold">{driver.name}</p>
                  <p className="font-mono text-[8px] text-[#6a7282] truncate">{driver.vehicle} · {driver.plate}</p>
                  <p className="font-mono text-[8px] text-[#6a7282]">★ {driver.rating}</p>
                </div>
              </div>
            )}
            <div className="bg-[#fef3c7] border border-[#f59e0b] rounded-xl p-4 mb-5 text-center">
              <p className="font-mono text-[9px] text-[#92400e] tracking-[2px] mb-1">PROPOSED FARE</p>
              <p className="font-mono text-[48px] text-black font-bold leading-none">₱{proposed ?? 0}</p>
              <p className="font-mono text-[9px] text-[#6a7282] mt-1 tracking-[0.4px]">
                {rider.pickup} → {rider.dropoff}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 h-[48px] border-2 border-[#ef4444] rounded-lg font-mono text-[11px] text-[#ef4444] tracking-[0.8px] hover:bg-[#ef4444] hover:text-white transition-all"
              >
                DECLINE
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 h-[48px] bg-[#10b981] rounded-lg font-mono text-[11px] text-white tracking-[0.8px] hover:bg-green-600 transition-all"
              >
                ACCEPT ₱{proposed ?? 0}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ── TRIP IN PROGRESS — persistent status pill ──────────────────────────────
  if (phase === "TRIP_IN_PROGRESS") {
    return createPortal(
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]">
        <div className="flex items-center gap-3 px-5 py-2.5 bg-black rounded-full shadow-xl border border-white/10">
          <div className="size-2 rounded-full bg-[#10b981] animate-pulse" />
          <span className="font-mono text-[10px] text-white tracking-[1px]">TRIP IN PROGRESS</span>
          <span className="font-mono text-[9px] text-white/40">·</span>
          <span className="font-mono text-[9px] text-white/60 tracking-[0.4px]">Driver is on the way to dropoff</span>
        </div>
      </div>,
      document.body
    );
  }

  // ── RATING — arrived celebration then rating form ──────────────────────────
  if (phase === "RATING") {
    const summary = rider.tripSummary;

    // 2.5 s "You've Arrived!" splash
    if (showArrived) {
      return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5 text-center px-8">
            <div
              className="size-28 rounded-full bg-[#10b981] flex items-center justify-center shadow-2xl"
              style={{ animation: "bounceIn 0.5s ease" }}
            >
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <path d="M10 26L21 37L42 15" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="font-mono text-[32px] text-white font-bold tracking-tight leading-none">You've Arrived!</p>
              <p className="font-mono text-[11px] text-white/50 tracking-[2px] mt-2">SAFE AND SOUND</p>
            </div>
            {summary && (
              <div className="bg-white/10 rounded-xl px-5 py-3 text-center border border-white/20">
                <p className="font-mono text-[9px] text-white/50 tracking-[1px] mb-1">FARE PAID</p>
                <p className="font-mono text-[24px] text-white font-bold">₱{summary.fareAmount}</p>
              </div>
            )}
          </div>
          <style>{`
            @keyframes bounceIn {
              0% { transform: scale(0.3); opacity: 0; }
              60% { transform: scale(1.15); opacity: 1; }
              100% { transform: scale(1); }
            }
          `}</style>
        </div>,
        document.body
      );
    }

    // Rating form
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-[440px] bg-white rounded-t-2xl shadow-2xl overflow-hidden">
          <div className="h-1 w-full bg-[#10b981]" />
          <div className="px-6 pt-5 pb-6">
            {/* Header */}
            <p className="font-mono text-[9px] text-[#10b981] tracking-[2px] mb-0.5">TRIP COMPLETE</p>
            <p className="font-mono text-[22px] text-black font-bold tracking-tight mb-1">Rate your ride</p>
            {summary && (
              <p className="font-mono text-[9px] text-[#99a1af] tracking-[0.4px] mb-5 truncate">
                {summary.pickup} → {summary.dropoff} · ₱{summary.fareAmount}
              </p>
            )}

            {/* Star selector */}
            <div className="flex items-center justify-center gap-3 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedStars(star)}
                  className="text-[36px] leading-none transition-transform hover:scale-110 active:scale-95"
                >
                  <span className={
                    star <= (hoveredStar || selectedStars)
                      ? "text-[#f59e0b]"
                      : "text-[#e5e7eb]"
                  }>★</span>
                </button>
              ))}
            </div>

            {/* Tag chips */}
            <div className="flex flex-wrap gap-2 justify-center mb-5">
              {ALL_RATING_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((t) => t !== tag)
                          : [...prev, tag]
                      )
                    }
                    className={`font-mono text-[9px] px-3 py-1.5 border rounded-full tracking-[0.4px] transition-all ${
                      active
                        ? "bg-black text-white border-black"
                        : "bg-white text-[#6a7282] border-[#e5e7eb] hover:border-black hover:text-black"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmitRating}
              disabled={selectedStars === 0 || submitting}
              className={`w-full h-[48px] font-mono text-[11px] tracking-[1px] transition-all ${
                selectedStars > 0 && !submitting
                  ? "bg-black text-white hover:bg-gray-900 active:scale-[0.99]"
                  : "bg-[#f3f4f6] text-[#99a1af] cursor-not-allowed"
              }`}
            >
              {submitting ? "SUBMITTING..." : "SUBMIT RATING"}
            </button>
            <button
              onClick={() => rider_submitRating(0, [])}
              className="w-full h-[36px] font-mono text-[9px] text-[#99a1af] tracking-[0.4px] hover:text-black transition-colors mt-1"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ── SEARCHING / DRIVER_FOUND ───────────────────────────────────────────────
  const stage  = STAGES[stageIdx];
  const isDone = stage.done || phase === "DRIVER_FOUND";
  const driver = rider.matchedDriver;

  return createPortal(
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] w-[340px] rounded-2xl bg-white shadow-2xl border border-[#f3f4f6] overflow-hidden"
      role="status"
      aria-live="polite"
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full ${isDone ? "bg-[#10b981]" : "bg-black animate-pulse"}`} />

      <div className="px-5 py-4">
        {/* Stage header */}
        <div className="flex items-center gap-3 mb-3">
          {isDone ? (
            <div className="size-9 rounded-full bg-[#d1fae5] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8L6.5 11.5L13 4.5" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <div className="size-9 rounded-full border-2 border-black border-t-transparent animate-spin shrink-0" />
          )}
          <div>
            <p className="font-mono text-[13px] text-black font-semibold tracking-tight">{stage.label}</p>
            <p className="font-mono text-[9px] text-[#99a1af] tracking-[0.4px] mt-0.5">{stage.subtext}</p>
          </div>
        </div>

        {/* Pulse ring animation */}
        {!isDone && (
          <div className="relative flex items-center justify-center h-[64px] mb-3">
            <div className="absolute size-12 rounded-full bg-black opacity-5 animate-ping" style={{ animationDuration: "1.2s" }} />
            <div className="absolute size-8 rounded-full bg-black opacity-10 animate-ping" style={{ animationDuration: "1.6s", animationDelay: "0.2s" }} />
            <div className="size-5 rounded-full bg-black" />
          </div>
        )}

        {/* Driver card (shown when found) */}
        {isDone && driver && (
          <div className="border border-[#e5e7eb] rounded-xl p-3 mb-3 flex items-center gap-3">
            <div className="size-10 bg-black rounded-full flex items-center justify-center shrink-0">
              <span className="font-mono text-[11px] text-white">{driver.initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[11px] text-black font-semibold">{driver.name}</p>
              <p className="font-mono text-[8px] text-[#6a7282] truncate">{driver.vehicle} · {driver.plate}</p>
              <p className="font-mono text-[8px] text-[#6a7282]">★ {driver.rating}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono text-[9px] text-[#99a1af]">ETA</p>
              <p className={`font-mono text-[15px] font-bold ${etaSecondsLeft <= 60 ? "text-[#f59e0b]" : "text-black"}`}>
                {etaSecondsLeft > 0 ? fmtTime(etaSecondsLeft) : "Arrived"}
              </p>
              <p className="font-mono text-[8px] text-[#99a1af]">{driver.distanceKm} km away</p>
            </div>
          </div>
        )}

        {/* Action row */}
        <div className="flex gap-2">
          {isDone ? (
            <>
              <div className="flex-1 h-[36px] bg-[#d1fae5] rounded-lg flex items-center justify-center gap-2">
                <div className="size-2 rounded-full bg-[#10b981] animate-pulse" />
                <span className="font-mono text-[10px] text-[#065f46] tracking-[0.4px]">
                  Waiting for driver to start trip…
                </span>
              </div>
              <button
                onClick={handleCancel}
                className="h-[36px] px-3 border border-[#ef4444] rounded-lg font-mono text-[9px] text-[#ef4444] tracking-[0.4px] hover:bg-[#ef4444] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleCancel}
              className="flex-1 h-[36px] border border-[#d1d5dc] rounded-lg font-mono text-[10px] text-[#6a7282] tracking-[0.4px] hover:border-black hover:text-black transition-colors"
            >
              Cancel search
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
