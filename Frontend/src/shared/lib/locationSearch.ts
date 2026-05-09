import type { GeoCoords } from "../components/map/useGeolocation";

// ─── Types ───────────────────────────────────────────────────────────────────

/** A unified search result — covers both local POI and Photon API results. */
export interface LocationResult {
  id: string;
  label: string;           // display name shown in the dropdown
  sublabel?: string;       // secondary line (street/city)
  coords: GeoCoords;
  source: "local" | "photon";
}

/** Photon API response shape (subset of GeoJSON FeatureCollection). */
export interface PhotonResponse {
  type: "FeatureCollection";
  features: PhotonFeature[];
}

export interface PhotonFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    osm_id?: number;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    type?: string;
  };
}

/** A local campus POI entry. */
export interface CampusPOI {
  id: string;
  label: string;
  sublabel: string;
  keywords: string[];      // searchable aliases (lowercase)
  coords: GeoCoords;
}

// ─── Local Campus POIs ────────────────────────────────────────────────────────
// Approximate coordinates for key CIT-U campus landmarks.
// Add more entries here as needed; no rebuild required.

export const CAMPUS_POIS: CampusPOI[] = [
  {
    id: "poi-main-gate",
    label: "CIT-U Main Gate",
    sublabel: "N. Bacalso Avenue, Cebu City",
    keywords: ["main gate", "main entrance", "citu gate", "front gate", "bacalso"],
    coords: { lat: 10.2941, lng: 123.8818 },
  },
  {
    id: "poi-engineering-gate",
    label: "Engineering Gate",
    sublabel: "Engineering Building entrance, CIT-U",
    keywords: ["engineering gate", "engg gate", "engineering entrance", "ee gate"],
    coords: { lat: 10.2950, lng: 123.8826 },
  },
  {
    id: "poi-library",
    label: "CIT-U Library",
    sublabel: "Learning Resource Center, CIT-U",
    keywords: ["library", "lrc", "learning resource", "lib"],
    coords: { lat: 10.2948, lng: 123.8821 },
  },
  {
    id: "poi-admin",
    label: "Administration Building",
    sublabel: "Admin offices, CIT-U",
    keywords: ["admin", "administration", "admin building", "registrar", "offices"],
    coords: { lat: 10.2944, lng: 123.8825 },
  },
  {
    id: "poi-cafeteria",
    label: "Campus Cafeteria",
    sublabel: "Student dining area, CIT-U",
    keywords: ["cafeteria", "canteen", "caf", "food", "dining"],
    coords: { lat: 10.2947, lng: 123.8819 },
  },
  {
    id: "poi-dorm-a",
    label: "Dormitory Block A",
    sublabel: "Residential dormitory, CIT-U",
    keywords: ["dorm", "dormitory", "block a", "dorm a", "residential"],
    coords: { lat: 10.2938, lng: 123.8820 },
  },
  {
    id: "poi-science",
    label: "Science Building",
    sublabel: "Natural & Applied Sciences, CIT-U",
    keywords: ["science", "science building", "cas", "natural sciences", "labs"],
    coords: { lat: 10.2952, lng: 123.8828 },
  },
  {
    id: "poi-gym",
    label: "University Gymnasium",
    sublabel: "Sports complex, CIT-U",
    keywords: ["gym", "gymnasium", "sports", "pe", "basketball", "court"],
    coords: { lat: 10.2940, lng: 123.8830 },
  },
  {
    id: "poi-sm-cebu",
    label: "SM City Cebu",
    sublabel: "North Reclamation Area, Cebu City",
    keywords: ["sm", "sm city", "sm cebu", "mall", "sm north"],
    coords: { lat: 10.2933, lng: 123.9005 },
  },
  {
    id: "poi-main-plaza",
    label: "Main Campus Plaza",
    sublabel: "Central open area, CIT-U",
    keywords: ["plaza", "main plaza", "center", "quadrangle", "quad"],
    coords: { lat: 10.2946, lng: 123.8823 },
  },
];

// ─── Local POI Search ─────────────────────────────────────────────────────────

/** Returns campus POIs whose keywords or label match the query (case-insensitive). */
export function searchLocalPOIs(query: string): LocationResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return CAMPUS_POIS
    .filter(
      (poi) =>
        poi.label.toLowerCase().includes(q) ||
        poi.keywords.some((k) => k.includes(q))
    )
    .slice(0, 5)
    .map((poi) => ({
      id: poi.id,
      label: poi.label,
      sublabel: poi.sublabel,
      coords: poi.coords,
      source: "local" as const,
    }));
}

// ─── Photon Fetch ─────────────────────────────────────────────────────────────

/**
 * Queries the free Photon geocoding API with location bias from the user's
 * actual GPS coords (or CIT-U fallback). No API key required.
 */
export async function fetchPhotonResults(
  query: string,
  biasCoords: GeoCoords,
  limit = 5
): Promise<LocationResult[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  // Location bias — ranks results by proximity to the user's real position
  url.searchParams.set("lat", String(biasCoords.lat));
  url.searchParams.set("lon", String(biasCoords.lng));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Photon error: ${res.status}`);

  const data: PhotonResponse = await res.json();

  return data.features.map((f, i) => {
    const p = f.properties;
    const name = p.name ?? p.street ?? "Unknown place";
    const city = [p.city, p.state, p.country].filter(Boolean).join(", ");
    return {
      id: `photon-${p.osm_id ?? i}-${i}`,
      label: name,
      sublabel: city || undefined,
      coords: {
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      },
      source: "photon" as const,
    };
  });
}
