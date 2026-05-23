import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../../core/config/supabase.config.js";
import { sendSuccess, sendError } from "../../core/common/api-response.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendError(res, 400, "Email and password required");
  }
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return sendError(res, 401, error?.message ?? "Invalid credentials");
  }
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("id, full_name, email, student_id, role, account_status, is_verified, phone_number, university, avatar_url, vehicle, vehicle_type, driver_verification_status, rating, rides_completed")
    .eq("id", data.user.id)
    .maybeSingle();

  return sendSuccess(res, {
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: userRow ?? {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name ?? "",
      student_id: data.user.user_metadata?.student_id ?? "",
      role: "RIDER",
      account_status: "PENDING",
      is_verified: false,
    },
  });
});

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const { email, password, full_name, student_id } = req.body;
  if (!email || !password || !full_name) {
    return sendError(res, 400, "Email, password, and full name required");
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, student_id: student_id ?? "" },
  });
  if (authError || !authData.user) {
    return sendError(res, 400, authError?.message ?? "Registration failed");
  }

  // Upsert user profile row (trigger may already have created it)
  await supabaseAdmin.from("users").upsert({
    id: authData.user.id,
    email,
    full_name,
    student_id: student_id ?? "",
    role: "RIDER",
    account_status: "PENDING",
    is_verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "id", ignoreDuplicates: true });

  // Sign in to get a session token
  const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (sessionError || !sessionData.session) {
    return sendSuccess(res, { message: "Account created. Please log in.", userId: authData.user.id });
  }

  return sendSuccess(res, {
    token: sessionData.session.access_token,
    refreshToken: sessionData.session.refresh_token,
    user: {
      id: authData.user.id,
      email,
      full_name,
      student_id: student_id ?? "",
      role: "RIDER",
      account_status: "PENDING",
      is_verified: false,
    },
  });
});

// POST /api/auth/logout  (client just discards token, but let backend know)
router.post("/logout", (_req: Request, res: Response) => {
  return sendSuccess(res, { message: "Logged out" });
});

export default router;
