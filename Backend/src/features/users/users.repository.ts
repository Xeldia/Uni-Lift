import { supabaseAdmin } from "../../core/config/supabase.config.js";

const ACTIVE_RIDE_STATUSES = ["SEARCHING", "FARE_PROPOSED", "ACCEPTED", "EN_ROUTE_TO_PICKUP", "TRIP_IN_PROGRESS", "RATING"];

export const usersRepository = {
  listUsers() {
    return supabaseAdmin.from("users").select("*").order("created_at", { ascending: false });
  },

  getUserById(userId: string) {
    return supabaseAdmin.from("users").select("*").eq("id", userId).single();
  },

  countActiveRidesForUser(userId: string) {
    return supabaseAdmin
      .from("rides")
      .select("id, status", { count: "exact", head: false })
      .or(`driver_id.eq.${userId},rider_id.eq.${userId}`)
      .in("status", ACTIVE_RIDE_STATUSES);
  },

  getUserPhotoById(userId: string) {
    return supabaseAdmin
      .from("users")
      .select("id, profile_photo, profile_photo_mime, profile_photo_name, profile_photo_updated_at")
      .eq("id", userId)
      .maybeSingle();
  },

  updateUserPhotoById(userId: string, payload: {
    profile_photo: string;
    profile_photo_mime: string;
    profile_photo_name: string;
    profile_photo_updated_at: string;
    updated_at: string;
  }) {
    return supabaseAdmin.from("users").update(payload).eq("id", userId);
  },

  clearUserPhotoById(userId: string, updatedAt: string) {
    return supabaseAdmin
      .from("users")
      .update({
        profile_photo: null,
        profile_photo_mime: null,
        profile_photo_name: null,
        profile_photo_updated_at: null,
        updated_at: updatedAt,
      })
      .eq("id", userId);
  },

  updateUserStatusById(userId: string, status: "ACTIVE" | "SUSPENDED") {
    return supabaseAdmin
      .from("users")
      .update({ account_status: status, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
  },

  suspendUserById(userId: string, reason: string, suspendedUntil: string | null) {
    return supabaseAdmin
      .from("users")
      .update({
        account_status: "SUSPENDED",
        suspend_reason: reason || "Suspended by admin",
        suspended_at: new Date().toISOString(),
        suspended_until: suspendedUntil,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();
  },

  reactivateUserById(userId: string) {
    return supabaseAdmin
      .from("users")
      .update({
        account_status: "ACTIVE",
        suspend_reason: null,
        suspended_at: null,
        suspended_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();
  },

  setUserRoleById(userId: string, payload: Record<string, unknown>) {
    return supabaseAdmin
      .from("users")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
  },

  insertAdminRoleAudit(payload: {
    admin_id: string;
    target_user_id: string;
    previous_roles: string[] | null;
    new_roles: string[] | null;
    reason: string | null;
  }) {
    return supabaseAdmin.from("admin_role_audit").insert({
      ...payload,
      created_at: new Date().toISOString(),
    });
  },

  revokeDriverById(userId: string, reason: string) {
    return supabaseAdmin
      .from("users")
      .update({
        role: "rider",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();
  },

  // Best-effort: update driver verification fields (requires migration_driver_verification_workflow.sql)
  revokeDriverVerificationById(userId: string, reason: string) {
    return supabaseAdmin
      .from("users")
      .update({
        driver_verification_status: "REVOKED",
        driver_rejection_reason: reason || "Driver permission revoked by admin",
      })
      .eq("id", userId);
  },

  listAccountPendingUsers() {
    return supabaseAdmin
      .from("users")
      .select("id, full_name, email, student_id, phone_number, university, role, account_status, suspend_reason, avatar_url, created_at, driver_verification_status")
      .eq("account_status", "PENDING")
      .order("created_at", { ascending: true });
  },

  listAccountProcessedUsers() {
    return supabaseAdmin
      .from("users")
      .select("id, full_name, email, student_id, phone_number, university, role, account_status, suspend_reason, avatar_url, created_at, driver_verification_status")
      .in("account_status", ["ACTIVE", "REJECTED"])
      .order("created_at", { ascending: false })
      .limit(50);
  },

  listDriverPendingUsers() {
    return supabaseAdmin
      .from("users")
      .select(`
        id, full_name, email, student_id, phone_number, university, role,
        account_status, suspend_reason, avatar_url, created_at,
        driver_verification_status, driver_full_address, driver_college,
        driver_course, driver_plate_number, driver_license_number,
        license_front_url, license_back_url, vehicle_reg_url, docs_submitted_at,
        driver_rejection_reason, driver_verified_at
      `)
      .eq("driver_verification_status", "PENDING")
      .order("created_at", { ascending: true });
  },

  listDriverProcessedUsers() {
    return supabaseAdmin
      .from("users")
      .select(`
        id, full_name, email, student_id, phone_number, university, role,
        account_status, suspend_reason, avatar_url, created_at,
        driver_verification_status, driver_full_address, driver_college,
        driver_course, driver_plate_number, driver_license_number,
        license_front_url, license_back_url, vehicle_reg_url, docs_submitted_at,
        driver_rejection_reason, driver_verified_at
      `)
      .in("driver_verification_status", ["APPROVED", "REJECTED", "REVOKED"])
      .order("created_at", { ascending: false })
      .limit(100);
  },

  submitDriverVerificationById(userId: string, payload: {
    fullAddress: string;
    college: string;
    course: string;
    plateNumber: string;
    licenseNumber: string;
    licenseFrontUrl?: string;
    licenseBackUrl?: string;
    vehicleRegUrl?: string;
  }) {
    const now = new Date().toISOString();
    return supabaseAdmin
      .from("users")
      .update({
        driver_verification_status: "PENDING",
        driver_full_address: payload.fullAddress,
        driver_college: payload.college,
        driver_course: payload.course,
        driver_plate_number: payload.plateNumber,
        driver_license_number: payload.licenseNumber,
        license_front_url: payload.licenseFrontUrl ?? null,
        license_back_url: payload.licenseBackUrl ?? null,
        vehicle_reg_url: payload.vehicleRegUrl ?? null,
        docs_submitted_at: now,
        driver_rejection_reason: null,
        driver_verified_at: null,
        updated_at: now,
      })
      .eq("id", userId)
      .select()
      .single();
  },

  approveAccountVerificationById(userId: string) {
    return supabaseAdmin
      .from("users")
      .update({ account_status: "ACTIVE", suspend_reason: null, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
  },

  rejectAccountVerificationById(userId: string, reason: string) {
    return supabaseAdmin
      .from("users")
      .update({
        account_status: "REJECTED",
        suspend_reason: reason || "Did not meet requirements",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();
  },

  approveDriverVerificationById(userId: string) {
    return supabaseAdmin
      .from("users")
      .update({
        role: "driver",
        driver_verification_status: "APPROVED",
        driver_rejection_reason: null,
        driver_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();
  },

  rejectDriverVerificationById(userId: string, reason: string) {
    return supabaseAdmin
      .from("users")
      .update({
        role: "rider",
        driver_verification_status: "REJECTED",
        driver_rejection_reason: reason || "Driver verification requirements not met.",
        driver_verified_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();
  },

  getAuthUserById(userId: string) {
    return supabaseAdmin.auth.admin.getUserById(userId);
  },

  updateAuthUserMetadata(userId: string, metadata: Record<string, unknown>) {
    return supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: metadata });
  },

  deleteUserById(userId: string) {
    return supabaseAdmin.from("users").delete().eq("id", userId);
  },

  disableAuthUserById(userId: string) {
    return supabaseAdmin.auth.admin.deleteUser(userId);
  },
};
