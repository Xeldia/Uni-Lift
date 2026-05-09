import { useEffect, useRef } from "react";
import { updateDriverGPS } from "../../../shared/lib/supabase";

/**
 * Watches the browser's GPS position and pushes it to the Supabase ride row.
 * Only active when `rideId` is truthy (i.e., a trip is IN_TRANSIT).
 * Returns the latest coords for use by the map.
 */
export function useDriverGPS(rideId: string | null) {
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!rideId || !navigator.geolocation) return;

    // Throttle Supabase writes to at most once every 3 seconds
    let lastWrite = 0;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastWrite < 3000) return;
        lastWrite = now;
        updateDriverGPS(rideId, pos.coords.latitude, pos.coords.longitude);
      },
      (err) => console.warn("[GPS] Position error:", err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [rideId]);
}
