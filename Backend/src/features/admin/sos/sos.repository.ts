import { supabaseAdmin } from "../../../core/config/supabase.config.js";

export const sosRepository = {
  listSosAlerts() {
    return supabaseAdmin
      .from("sos_alerts")
      .select("*, user:users!sos_alerts_user_id_fkey(full_name, email), ride:rides!sos_alerts_ride_id_fkey(driver_id, pickup, dropoff)")
      .order("triggered_at", { ascending: false });
  },

  createSosAlert(payload: {
    user_id: string;
    ride_id: string;
    type: "ALARM" | "SILENT";
    location: string;
    lat: number;
    lng: number;
  }) {
    return supabaseAdmin
      .from("sos_alerts")
      .insert({
        ...payload,
        status: "ACTIVE",
        triggered_at: new Date().toISOString(),
      })
      .select()
      .single();
  },

  resolveSosAlert(alertId: string, resolvedBy: string, resolutionNote?: string) {
    return supabaseAdmin
      .from("sos_alerts")
      .update({
        status: "RESOLVED",
        resolution_note: resolutionNote ?? "Resolved by admin",
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", alertId)
      .select()
      .single();
  },
};
