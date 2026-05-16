import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeToRide } from "../../../shared/lib/supabase";

export function useRideDetailsPopup() {
  const [open, setOpen] = useState(false);
  const [ride, setRide] = useState(null);
  const unsubRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    setRide(null);
    if (typeof unsubRef.current === "function") {
      try { unsubRef.current(); } catch (e) { /* ignore */ }
    }
    unsubRef.current = null;
  }, []);

  const openFor = useCallback((rideId) => {
    if (!rideId) return;
    // If already subscribed to same ride, keep it
    if (ride?.id === rideId && open) return;

    if (typeof unsubRef.current === "function") {
      try { unsubRef.current(); } catch (e) { /* ignore */ }
    }

    const unsub = subscribeToRide(rideId, (r) => {
      if (!r) return;
      setRide(r);
      setOpen(true);
    });
    unsubRef.current = unsub;
  }, [ride, open]);

  useEffect(() => {
    return () => {
      if (typeof unsubRef.current === "function") unsubRef.current();
    };
  }, []);

  return { open, ride, openFor, close };
}

export default useRideDetailsPopup;
