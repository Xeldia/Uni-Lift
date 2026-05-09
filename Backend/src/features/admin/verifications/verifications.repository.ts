import { supabaseAdmin } from "../../../core/config/supabase.config.js";

export const verificationsRepository = {
  listVerifications() {
    return supabaseAdmin
      .from("verifications")
      .select("*, user:users!verifications_user_id_fkey(full_name, email, student_id)")
      .order("submitted_at", { ascending: false });
  },

  createVerification(payload: {
    user_id: string;
    id_image_url: string;
    license_url: string;
    vehicle_type: string;
    plate_number: string;
  }) {
    return supabaseAdmin
      .from("verifications")
      .insert({
        ...payload,
        status: "PENDING",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();
  },

  reviewVerification(verificationId: string, status: "APPROVED" | "REJECTED", rejectionReason?: string) {
    return supabaseAdmin
      .from("verifications")
      .update({
        status,
        rejection_reason: rejectionReason ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", verificationId)
      .select()
      .single();
  },
};
