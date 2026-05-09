export type SosStatus = "ACTIVE" | "RESOLVED";

export type SosAlertRecord = {
  id: string;
  user_id: string;
  ride_id: string;
  type: "ALARM" | "SILENT";
  location: string;
  lat: number;
  lng: number;
  status: SosStatus;
  triggered_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
};
