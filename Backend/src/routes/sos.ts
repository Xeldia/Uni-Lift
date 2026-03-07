import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/sos — admin: list all SOS alerts
router.get("/", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("sos_alerts")
    .select("*, user:users!sos_alerts_user_id_fkey(full_name, email), ride:rides!sos_alerts_ride_id_fkey(driver_id, pickup, dropoff)")
    .order("triggered_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// POST /api/sos — trigger an SOS alert (authenticated user)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { ride_id, type, location, lat, lng } = req.body as {
    ride_id: string;
    type: "ALARM" | "SILENT";
    location: string;
    lat: number;
    lng: number;
  };

  const { data, error } = await supabaseAdmin
    .from("sos_alerts")
    .insert({
      user_id: user.id,
      ride_id,
      type,
      location,
      lat,
      lng,
      status: "ACTIVE",
      triggered_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

// PATCH /api/sos/:id/resolve — admin: mark alert as resolved
router.patch("/:id/resolve", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { resolution_note } = req.body as { resolution_note?: string };
  const resolvedBy = ((req as any).user as any).email;

  const { data, error } = await supabaseAdmin
    .from("sos_alerts")
    .update({
      status: "RESOLVED",
      resolution_note: resolution_note ?? "Resolved by admin",
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
