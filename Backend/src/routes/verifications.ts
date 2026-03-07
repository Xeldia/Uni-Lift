import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/verifications — admin: list all verification requests
router.get("/", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("verifications")
    .select("*, user:users!verifications_user_id_fkey(full_name, email, student_id)")
    .order("submitted_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// POST /api/verifications — submit a verification request
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id_image_url, license_url, vehicle_type, plate_number } = req.body;

  const { data, error } = await supabaseAdmin
    .from("verifications")
    .insert({
      user_id: user.id,
      id_image_url,
      license_url,
      vehicle_type,
      plate_number,
      status: "PENDING",
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

// PATCH /api/verifications/:id — admin: approve or reject
router.patch("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { status, rejection_reason } = req.body as { status: "APPROVED" | "REJECTED"; rejection_reason?: string };

  if (!["APPROVED", "REJECTED"].includes(status)) {
    res.status(400).json({ error: "Status must be APPROVED or REJECTED" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("verifications")
    .update({ status, rejection_reason: rejection_reason ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
