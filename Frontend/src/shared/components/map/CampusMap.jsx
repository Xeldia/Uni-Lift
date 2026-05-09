import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Fix Vite bundler breaking Leaflet's default icon URLs ───────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// CIT-U Campus center coordinates
const CITU = { lat: 10.2946, lng: 123.8823 };

// No default/mock drivers — only real online drivers from Supabase are shown.

// ─── Pulsing blue dot for current user location ───────────────────────────────
const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:20px;height:20px">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,0.25);animation:ulpulse 1.5s ease-in-out infinite;"></div>
      <div style="position:absolute;inset:3px;border-radius:50%;background:#2563eb;border:2px solid #fff;box-shadow:0 0 6px rgba(37,99,235,0.8);"></div>
    </div>
    <style>@keyframes ulpulse{0%{transform:scale(1);opacity:.8}70%{transform:scale(2.5);opacity:0}100%{transform:scale(1);opacity:0}}</style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ─── Driver icon factory ──────────────────────────────────────────────────────
// statusColor: green ring = TAKING_ORDERS, yellow ring = ONLINE
const STATUS_RING = {
  TAKING_ORDERS: "#10b981",
  ONLINE:        "#f59e0b",
  OFFLINE:       "#9ca3af",
};

const makeDriverIcon = (initials, driverStatus = "TAKING_ORDERS") => {
  const ringColor = STATUS_RING[driverStatus] ?? STATUS_RING.TAKING_ORDERS;
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:34px;height:34px">
        <div style="
          width:28px;height:28px;border-radius:50%;
          background:#0a0a0a;border:2px solid #fff;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);font-size:9px;color:#fff;
          font-family:monospace;font-weight:700;letter-spacing:0.5px;
          position:absolute;top:3px;left:3px;
        ">${initials}</div>
        <div style="
          position:absolute;bottom:0;right:0;
          width:10px;height:10px;border-radius:50%;
          background:${ringColor};border:2px solid #fff;
        "></div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

// ─── Live GPS driver icon (green pulsing ring, shown during active trip) ───────────
const makeTripDriverIcon = (initials = "DR") =>
  L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:40px;height:40px">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(16,185,129,0.25);animation:ulpulse 1.4s ease-in-out infinite;"></div>
        <div style="
          width:30px;height:30px;border-radius:50%;
          background:#0a0a0a;border:2px solid #10b981;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 10px rgba(16,185,129,0.5);font-size:9px;color:#fff;
          font-family:monospace;font-weight:700;
          position:absolute;top:5px;left:5px;
        ">${initials}</div>
        <div style="
          position:absolute;bottom:1px;right:1px;
          width:12px;height:12px;border-radius:50%;
          background:#10b981;border:2px solid #fff;animation:ulpulse 1s ease-in-out infinite;
        "></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

// ─── Destination pin icon ─────────────────────────────────────────────────────
const makeDestIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#ef4444;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(239,68,68,0.6);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

// ─── Helper: trigger map resize when container changes ────────────────────────
function InvalidateSize() {
  const map = useMap();
  useEffect(() => { map.invalidateSize(); }, [map]);
  return null;
}

// ─── OSRM Route Layer ─────────────────────────────────────────────────────────
// Fetches a road-following route from the free OSRM public demo server and
// renders it as a blue polyline. No API key required.
// Profile: /driving/ → optimises for fastest time (road speed limits).
function RouteLayer({ pickup, destination }) {
  const [routeCoords, setRouteCoords] = useState([]);

  useEffect(() => {
    if (!pickup?.lat || !pickup?.lng || !destination?.lat || !destination?.lng) {
      setRouteCoords([]);
      return;
    }

    const origin = `${pickup.lng},${pickup.lat}`;
    const dest   = `${destination.lng},${destination.lat}`;
    const url    = `https://router.project-osrm.org/route/v1/driving/${origin};${dest}?overview=full&geometries=geojson`;

    let cancelled = false;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const coords = data?.routes?.[0]?.geometry?.coordinates ?? [];
        // OSRM returns [lng, lat]; Leaflet expects [lat, lng]
        setRouteCoords(coords.map(([lng, lat]) => [lat, lng]));
      })
      .catch(() => { if (!cancelled) setRouteCoords([]); });

    return () => { cancelled = true; };
  }, [pickup, destination]);

  if (!routeCoords.length) return null;

  return (
    <Polyline
      positions={routeCoords}
      pathOptions={{
        color: "#2563eb",
        weight: 4,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }}
    />
  );
}

// ─── Pickup pin icon (blue teardrop) ─────────────────────────────────────────
const makePickupIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#2563eb;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(37,99,235,0.6);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

// ─── Animated dashed route for in-progress trips (OSRM road-following) ──────
// Fetches the same road route as RouteLayer, then animates the dashOffset.
function AnimatedRoute({ pickup, destination }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!pickup?.lat || !destination?.lat) return;

    if (!document.getElementById("route-dash-style")) {
      const style = document.createElement("style");
      style.id = "route-dash-style";
      style.textContent = `
        @keyframes routeDash{from{stroke-dashoffset:54}to{stroke-dashoffset:0}}
        /* Apply animation to polyline via class to survive Leaflet redraws during zoom */
        .route-dash path { stroke-dasharray: 18 9; animation: routeDash 1.2s linear infinite; }
      `;
      document.head.appendChild(style);
    }

    let cancelled = false;
    const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

    fetch(url).then(r=>r.json()).then(data => {
      if (cancelled) return;
      const latlngs = (data?.routes?.[0]?.geometry?.coordinates ?? []).map(([lng,lat])=>[lat,lng]);
      if (!latlngs.length) return;
      // Create polyline with a stable className so the CSS animation persists
      const layer = L.polyline(latlngs, {
        color: "#2563eb",
        weight: 5,
        lineCap: "round",
        lineJoin: "round",
        className: "route-dash",
      }).addTo(map);
      layerRef.current = layer;
    }).catch(()=>{});

    return () => { cancelled=true; if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current=null; } };
  }, [map, pickup, destination]);
  return null;
}

// ─── Gray OSRM route (driver → rider pickup) ─────────────────────────────────
function DriverRouteLayer({ from, to }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!from?.lat || !to?.lat) return;
    let cancelled = false;
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

    fetch(url).then(r=>r.json()).then(data => {
      if (cancelled) return;
      const latlngs = (data?.routes?.[0]?.geometry?.coordinates ?? []).map(([lng,lat])=>[lat,lng]);
      if (!latlngs.length) return;
      if (layerRef.current) map.removeLayer(layerRef.current);
      // Pale gray dashed line — visually secondary to the blue rider route
      layerRef.current = L.polyline(latlngs, {
        color: "#9ca3af",
        weight: 3,
        dashArray: "8 8",
        lineCap: "round",
        lineJoin: "round",
        opacity: 0.7,
      }).addTo(map);
    }).catch(()=>{});

    return () => { cancelled=true; if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current=null; } };
  }, [map, from, to]);
  return null;
}

// ─── Driver "you are here" car marker (amber pulsing) ────────────────────────
const makeDriverSelfIcon = () => L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:44px;height:44px">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(245,158,11,0.2);animation:ulpulse 1.3s ease-in-out infinite;"></div>
      <div style="position:absolute;top:7px;left:7px;width:30px;height:30px;border-radius:50%;
        background:#0a0a0a;border:2px solid #f59e0b;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 10px rgba(245,158,11,0.5);font-size:14px;">
        🚗
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// ─── Static route polyline / Map camera controller ────────────────────────────
// Listens to pickup/destination coord changes and smoothly flies the camera.
// When both pins exist → flyToBounds to show the whole route.
// When only one exists → flyTo that pin at zoom 17.
function MapController({ pickup, destination }) {
  const map = useMap();

  useEffect(() => {
    if (destination) {
      if (pickup?.lat && pickup?.lng) {
        const bounds = [
          [pickup.lat, pickup.lng],
          [destination.lat, destination.lng],
        ];
        map.flyToBounds(bounds, { padding: [60, 60], duration: 1.2 });
      } else {
        map.flyTo([destination.lat, destination.lng], 17, { duration: 1.2 });
      }
    } else if (pickup?.lat && pickup?.lng) {
      map.flyTo([pickup.lat, pickup.lng], 17, { duration: 1.0 });
    }
  }, [map, pickup, destination]);

  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────
// Props (all optional for backward compat with existing callers):
//   drivers             – array of { id, initials, color?, lat?, lng? }
//   showCurrentLocation – boolean (default true)
//   compact             – boolean, smaller zoom (default false)
//   pickup              – { lat, lng, label? } | null  ← NEW
//   destination         – { lat, lng, label? } | null
// Props:
//   drivers             – array of { id, initials?, full_name?, driver_status?, lat?, lng? }
//                         Pass [] or omit to show no driver markers (real data only).
//   showCurrentLocation – boolean (default true)
//   compact             – boolean, smaller zoom (default false)
//   pickup              – { lat, lng, label? } | null
//   destination         – { lat, lng, label? } | null
export function CampusMap({
  drivers = [],
  showCurrentLocation = true,
  compact = false,
  pickup = null,
  destination = null,
  tripInProgress = false,
  tripDriverLocation = null,    // { lat, lng } live GPS from Supabase
  driverLocation = null,        // { lat, lng, label? } driver's own position (testing)
  inspectPickup = null,         // { lat, lng, label? } ride pickup being inspected
  inspectDestination = null,    // { lat, lng, label? } ride dropoff being inspected
}) {
  const inspectMode = !!(inspectPickup?.lat && inspectDestination?.lat);
  // Only show drivers that have valid coordinates
  const activeDrivers = (drivers || []).filter((d) => d.lat != null && d.lng != null);

  const zoom = compact ? 15 : 16;

  // Positions for the route line (pickup → destination)
  const routePositions =
    pickup?.lat && destination?.lat
      ? [[pickup.lat, pickup.lng], [destination.lat, destination.lng]]
      : null;

  return (
    <div className="relative w-full h-full" style={{ minHeight: compact ? 200 : 380 }}>

      {/* LIVE Badge */}
      <div className="absolute top-3 right-3 z-[500] bg-[#10b981] px-1.5 py-0.5 flex items-center gap-1 pointer-events-none">
        <div className="size-1.5 rounded-full bg-white animate-pulse" />
        <span className="font-mono text-[7px] text-white tracking-[0.8px]">LIVE</span>
      </div>

      <MapContainer
        center={[CITU.lat, CITU.lng]}
        zoom={zoom}
        scrollWheelZoom
        zoomControl={!compact}
        attributionControl={false}
        className="w-full h-full"
        style={{ minHeight: compact ? 200 : 380 }}
      >
        {/* CartoDB Positron — clean rideshare-style tiles, no ferries/POI clutter */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        <InvalidateSize />
        <MapController
          pickup={inspectMode ? inspectPickup : pickup}
          destination={inspectMode ? inspectDestination : destination}
        />
        {/* ── Route rendering ── */}
        {inspectMode && tripInProgress ? (
          // Driver mid-trip: animated dashed route pickup → dropoff (matches rider view)
          <AnimatedRoute pickup={inspectPickup} destination={inspectDestination} />
        ) : inspectMode ? (
          // Driver pre-trip inspect: static blue route + gray driver-to-pickup leg
          <>
            <RouteLayer pickup={inspectPickup} destination={inspectDestination} />
            {driverLocation && <DriverRouteLayer from={driverLocation} to={inspectPickup} />}
          </>
        ) : tripInProgress ? (
          <AnimatedRoute pickup={pickup} destination={destination} />
        ) : (
          <RouteLayer pickup={pickup} destination={destination} />
        )}

        {/* Current user location */}
        {showCurrentLocation && (
          <>
            <Circle
              center={[CITU.lat, CITU.lng]}
              radius={80}
              pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.08, weight: 1 }}
            />
            <Marker position={[CITU.lat, CITU.lng]} icon={userIcon}>
              <Popup>📍 Your Location</Popup>
            </Marker>
          </>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={makeDestIcon()}>
            <Popup>🏁 {destination.label || "Destination"}</Popup>
          </Marker>
        )}

        {/* Pickup marker (only when a specific address is chosen, not the default campus center) */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={makePickupIcon()}>
            <Popup>📍 {pickup.label || "Pickup"}</Popup>
          </Marker>
        )}

        {/* Driver GPS marker during active trip */}
        {tripInProgress && tripDriverLocation && (
          <Marker position={[tripDriverLocation.lat, tripDriverLocation.lng]} icon={makeTripDriverIcon("DR")}>
            <Popup>🚗 Driver — Live Location</Popup>
          </Marker>
        )}

        {/* Driver's own "you are here" marker (amber car, driver mode) */}
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={makeDriverSelfIcon()}>
            <Popup>📍 {driverLocation.label || "Your Location"}</Popup>
          </Marker>
        )}

        {/* Inspect mode: show pickup + destination pins for the inspected ride */}
        {inspectMode && (
          <>
            <Marker position={[inspectPickup.lat, inspectPickup.lng]} icon={makePickupIcon()}>
              <Popup>📍 Rider Pickup</Popup>
            </Marker>
            <Marker position={[inspectDestination.lat, inspectDestination.lng]} icon={makeDestIcon()}>
              <Popup>🏁 Rider Destination</Popup>
            </Marker>
          </>
        )}

        {/* Driver markers — only real online drivers */}
        {!tripInProgress && !inspectMode && activeDrivers.map((driver) => {
          const initials = driver.initials
            ?? driver.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
            ?? "?";
          return (
            <Marker
              key={driver.id}
              position={[driver.lat, driver.lng]}
              icon={makeDriverIcon(initials, driver.driver_status)}
            >
              <Popup>
                <strong>{driver.full_name ?? driver.id}</strong>
                <br />
                <span style={{ color: STATUS_RING[driver.driver_status] ?? "#9ca3af" }}>
                  {driver.driver_status === "TAKING_ORDERS" ? "● Taking Orders"
                    : driver.driver_status === "ONLINE" ? "● Online"
                    : "● Offline"}
                </span>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
