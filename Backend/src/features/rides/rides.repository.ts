import { supabaseAdmin } from "../../core/config/supabase.config.js";

export const ridesRepository = {
  listRidesForAdmin() {
    return supabaseAdmin
      .from("rides")
      .select("*, driver:users!rides_driver_id_fkey(full_name, student_id), rider:users!rides_rider_id_fkey(full_name, student_id)")
      .order("scheduled_at", { ascending: false });
  },

  listRidesForUser(userId: string) {
    return supabaseAdmin
      .from("rides")
      .select("*, driver:users!rides_driver_id_fkey(full_name, student_id), rider:users!rides_rider_id_fkey(full_name, student_id)")
      .order("scheduled_at", { ascending: false })
      .or(`driver_id.eq.${userId},rider_id.eq.${userId}`);
  },

  getRideById(rideId: string) {
    return supabaseAdmin
      .from("rides")
      .select("*, driver:users!rides_driver_id_fkey(*), rider:users!rides_rider_id_fkey(*)")
      .eq("id", rideId)
      .single();
  },

  createRide(payload: {
    rider_id: string;
    pickup: string;
    dropoff: string;
    scheduled_at: string;
    passenger_count?: number | null;
    fare: number;
  }) {
    return supabaseAdmin
      .from("rides")
      .insert({
        ...payload,
        passenger_count: payload.passenger_count ?? null,
        status: "SEARCHING",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
  },

  updateRideStatus(rideId: string, status: string) {
    return supabaseAdmin
      .from("rides")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", rideId)
      .select()
      .single();
  },

  countActiveRidesForUser(userId: string) {
    return supabaseAdmin
      .from("rides")
      .select("id", { count: "exact", head: true })
      .or(`driver_id.eq.${userId},rider_id.eq.${userId}`)
      .in("status", ["SEARCHING", "SCHEDULED", "IN_TRANSIT"]);
  },
};
