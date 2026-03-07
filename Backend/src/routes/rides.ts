import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/rides — list rides (admin sees all, user sees their own)
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const isAdmin = user.user_metadata?.role === "admin";

  let query = supabaseAdmin
    .from("rides")
    .select("*, driver:users!rides_driver_id_fkey(full_name, student_id), rider:users!rides_rider_id_fkey(full_name, student_id)")
    .order("scheduled_at", { ascending: false });

  if (!isAdmin) {
    query = query.or(`driver_id.eq.${user.id},rider_id.eq.${user.id}`);
  }

  const { data, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// GET /api/rides/:id — get single ride
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("rides")
    .select("*, driver:users!rides_driver_id_fkey(*), rider:users!rides_rider_id_fkey(*)")
    .eq("id", req.params.id)
    .single();

  if (error) { res.status(404).json({ error: "Ride not found" }); return; }
  res.json(data);
});

// POST /api/rides — create a new ride request
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { pickup, dropoff, scheduled_at, fare } = req.body;

  const { data, error } = await supabaseAdmin
    .from("rides")
    .insert({
      rider_id: user.id,
      pickup,
      dropoff,
      scheduled_at,
      fare,
      status: "SEARCHING",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

// PATCH /api/rides/:id/status — update ride status
router.patch("/:id/status", requireAuth, async (req: Request, res: Response) => {
  const { status } = req.body as { status: string };

  const { data, error } = await supabaseAdmin
    .from("rides")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
