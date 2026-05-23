import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  triggerSOS,
  subscribeToRideSOS,
  getSession,
  type SOSAlert,
} from "../../../shared/lib/supabase";

type SOSState = "IDLE" | "SENT" | "RECEIVED" | "RESOLVED";

interface SOSOverlayProps {
  rideId: string | null;
  /** Which party is currently viewing: "RIDER" or "DRIVER" */
  viewerRole: "RIDER" | "DRIVER";
  /** Called when the user dismisses/acknowledges */
  onDismiss?: () => void;
}

// ─── Floating SOS trigger button ──────────────────────────────────────────────
export function SOSButton({
  rideId,
  viewerRole,
  onSOSActive,
}: {
  rideId: string | null;
  viewerRole: "RIDER" | "DRIVER";
  /** Fires true when SOS is active (controls should freeze), false when cleared */
  onSOSActive?: (active: boolean) => void;
}) {
  const [state, setState] = useState<SOSState>("IDLE");
  const [activeAlert, setActiveAlert] = useState<SOSAlert | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  // Get current user
  useEffect(() => {
    getSession().then((s) => { if (s?.user?.id) setUserId(s.user.id); });
  }, []);

  // Subscribe to SOS events on this ride
  useEffect(() => {
    if (!rideId) return;
    const unsub = subscribeToRideSOS(rideId, (alert) => {
      setActiveAlert(alert);
      if (alert.status === "RESOLVED") {
        setState("RESOLVED");
      } else if (alert.user_id !== userId) {
        // Someone else on the ride sent an SOS — show RECEIVED
        setState("RECEIVED");
      }
    });
    unsubRef.current = unsub;
    return () => { unsub(); unsubRef.current = null; };
  }, [rideId, userId]);

  const handleSOS = async () => {
    if (!userId || state !== "IDLE") return;
    setState("SENT");

    // Get current GPS
    const coords = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      );
    });

    const { error } = await triggerSOS(
      userId,
      rideId,
      "ALARM",
      coords?.lat,
      coords?.lng
    );

    if (error) {
      console.error("[SOS] Failed to trigger:", error.message);
      setState("IDLE");
    }
  };

  const dismiss = () => setState("IDLE");

  // Notify parent whenever SOS becomes active or inactive
  useEffect(() => {
    const active = state === "SENT" || state === "RECEIVED";
    onSOSActive?.(active);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <>
      {/* Floating SOS button — always visible during trip */}
      {state === "IDLE" && (
        <button
          onClick={handleSOS}
          className="fixed bottom-6 right-6 z-[9998] size-14 rounded-full bg-[#ef4444] shadow-lg shadow-red-400/40 flex items-center justify-center hover:scale-110 transition-transform group"
          title="Trigger SOS emergency alert"
        >
          <span className="font-mono text-[11px] text-white font-bold tracking-wide">SOS</span>
          <span className="absolute inset-0 rounded-full bg-[#ef4444] animate-ping opacity-30" />
        </button>
      )}

      {/* Overlay portal */}
      {state !== "IDLE" && createPortal(
        <SOSOverlayPanel
          state={state}
          alert={activeAlert}
          viewerRole={viewerRole}
          onDismiss={dismiss}
        />,
        document.body
      )}
    </>
  );
}

// ─── Overlay panel ────────────────────────────────────────────────────────────
function SOSOverlayPanel({
  state,
  alert,
  viewerRole,
  onDismiss,
}: {
  state: SOSState;
  alert: SOSAlert | null;
  viewerRole: "RIDER" | "DRIVER";
  onDismiss: () => void;
}) {
  if (state === "SENT") {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-[340px] bg-white rounded-2xl overflow-hidden shadow-2xl">
          {/* Red top bar */}
          <div className="bg-[#ef4444] h-2 w-full" />
          <div className="p-6 text-center">
            {/* Pulsing siren icon */}
            <div className="size-16 mx-auto bg-[#fef2f2] rounded-full flex items-center justify-center mb-4 relative">
              <span className="font-mono text-[22px] font-bold text-[#ef4444]">!</span>
              <span className="absolute inset-0 rounded-full bg-[#ef4444] opacity-20 animate-ping" />
            </div>
            <p className="font-mono text-[18px] text-black font-bold mb-1">SOS ALERT SENT</p>
            <p className="font-mono text-[10px] text-[#6a7282] tracking-wide mb-1">
              Your emergency has been reported.
            </p>
            <p className="font-mono text-[10px] text-[#6a7282] tracking-wide mb-6">
              Admin and emergency services have been notified.
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="size-2 rounded-full bg-[#ef4444] animate-pulse" />
              <span className="font-mono text-[9px] text-[#ef4444] tracking-[1px]">AWAITING RESPONSE</span>
            </div>
            <button
              onClick={onDismiss}
              className="w-full h-[40px] border border-[#d1d5dc] font-mono text-[10px] text-[#6a7282] hover:border-black hover:text-black transition-colors rounded-lg"
            >
              DISMISS
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "RECEIVED") {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-[340px] bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-[#f59e0b] h-2 w-full" />
          <div className="p-6 text-center">
            <div className="size-16 mx-auto bg-[#fef3c7] rounded-full flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 4L3 24H25L14 4Z" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
                <path d="M14 11V16M14 20V20.5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="font-mono text-[18px] text-black font-bold mb-1">SOS RECEIVED</p>
            <p className="font-mono text-[10px] text-[#6a7282] tracking-wide mb-1">
              {viewerRole === "DRIVER"
                ? "Your rider has triggered an emergency alert."
                : "Your driver has triggered an emergency alert."}
            </p>
            <p className="font-mono text-[10px] text-[#6a7282] tracking-wide mb-6">
              Admin has been notified. Help is on the way.
            </p>
            {alert?.location && (
              <div className="bg-[#fef3c7] rounded-lg p-2 mb-4">
                <p className="font-mono text-[8px] text-[#92400e] tracking-[1px]">REPORTED LOCATION</p>
                <p className="font-mono text-[10px] text-[#78350f]">{alert.location}</p>
              </div>
            )}
            <button
              onClick={onDismiss}
              className="w-full h-[40px] bg-black font-mono text-[10px] text-white hover:bg-gray-900 transition-colors rounded-lg"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "RESOLVED") {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-[340px] bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-[#10b981] h-2 w-full" />
          <div className="p-6 text-center">
            <div className="size-16 mx-auto bg-[#d1fae5] rounded-full flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M6 14L11 19L22 8" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-mono text-[18px] text-black font-bold mb-1">ALERT RESOLVED</p>
            <p className="font-mono text-[10px] text-[#6a7282] tracking-wide mb-1">
              Help is on the way. Stay calm and stay safe.
            </p>
            {alert?.resolution_note && (
              <div className="bg-[#f0fdf4] rounded-lg p-2 mb-4">
                <p className="font-mono text-[9px] text-[#166534]">{alert.resolution_note}</p>
              </div>
            )}
            <button
              onClick={onDismiss}
              className="w-full h-[40px] bg-[#10b981] font-mono text-[10px] text-white hover:bg-green-600 transition-colors rounded-lg"
            >
              OK, GOT IT
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
