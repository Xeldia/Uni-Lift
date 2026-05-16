import React from "react";
import { createPortal } from "react-dom";
import { CampusMap } from "../../../shared/components/map/CampusMap";

export function RideDetailsPopup({ open, onClose, ride }) {
  if (!open) return null;

  const pickup = ride ? { lat: ride.pickup_lat, lng: ride.pickup_lng } : null;
  const destination = ride ? { lat: ride.dropoff_lat, lng: ride.dropoff_lng } : null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-[90%] max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-3 border-b border-[#e5e7eb] flex items-start justify-between">
          <div>
            <h3 className="font-mono text-[14px]">Ride details</h3>
            <p className="font-mono text-[11px] text-[#6a7282]">{ride?.pickup} → {ride?.dropoff}</p>
          </div>
          <button onClick={onClose} className="font-mono text-[12px] text-[#6a7282]">Close</button>
        </div>

        <div className="h-[320px]">
          {/* CampusMap is a JS component without explicit TS types; cast to any to satisfy TS */}
          <CampusMap
            pickup={pickup as any}
            destination={destination as any}
            drivers={[]}
            tripInProgress={false}
          />
        </div>

        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-mono text-[12px] text-black">Driver</p>
              <p className="font-mono text-[11px] text-[#6a7282]">{ride?.driver_name ?? "—"}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[12px] text-black">Fare</p>
              <p className="font-mono text-[11px] text-[#6a7282]">₱{ride?.fare ?? "—"}</p>
            </div>
          </div>
          <div className="font-mono text-[11px] text-[#6a7282]">{ride?.notes}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default RideDetailsPopup;
