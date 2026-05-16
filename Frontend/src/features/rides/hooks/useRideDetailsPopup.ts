import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeToRide } from "../../../shared/lib/supabase";

type Unsub = (() => void) | null;

export function useRideDetailsPopup() {
  const [open, setOpen] = useState<boolean>(false);
  const [ride, setRide] = useState<any>(null);
  const unsubRef = useRef<Unsub>(null);

  const close = useCallback(() => {
    setOpen(false);
    setRide(null);
    if (typeof unsubRef.current === "function") {
      try { (unsubRef.current as (() => void))(); } catch (e) { /* ignore */ }
    }
    unsubRef.current = null;
  }, []);

  const openFor = useCallback((rideId: string) => {
    if (!rideId) return;
    // If already subscribed to same ride, keep it
    if (ride?.id === rideId && open) return;

    if (typeof unsubRef.current === "function") {
      try { (unsubRef.current as (() => void))(); } catch (e) { /* ignore */ }
    }

    const unsub = subscribeToRide(rideId, (r: any) => {
      if (!r) return;
      setRide(r);
      setOpen(true);
    });
    unsubRef.current = unsub as Unsub;
  }, [ride, open]);

  useEffect(() => {
    return () => {
      if (typeof unsubRef.current === "function") (unsubRef.current as (() => void))();
    };
  }, []);

  return { open, ride, openFor, close };
}

export default useRideDetailsPopup;
