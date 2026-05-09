import { useState, useEffect } from "react";

export interface GeoCoords {
  lat: number;
  lng: number;
}

interface GeolocationState {
  coords: GeoCoords | null;
  loading: boolean;
  error: string | null;
}

const CITU_DEFAULT: GeoCoords = { lat: 10.2946, lng: 123.8823 };

/**
 * Attempts to get the browser's live GPS coords.
 * Falls back to CIT-U campus center if denied or unavailable.
 * Returns { coords, loading, error } — coords is NEVER null after loading=false.
 */
export function useGeolocation(): GeolocationState & { effectiveCoords: GeoCoords } {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ coords: null, loading: false, error: "Geolocation not supported" });
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState({ coords: null, loading: false, error: err.message });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return {
    ...state,
    effectiveCoords: state.coords ?? CITU_DEFAULT,
  };
}
