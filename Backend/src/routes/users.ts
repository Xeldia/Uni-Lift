import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/users — admin: list all users
router.get("/", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// GET /api/users/:id — get single user profile
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) { res.status(404).json({ error: "User not found" }); return; }
  res.json(data);
});

// PATCH /api/users/:id/status — admin: suspend or activate a user
router.patch("/:id/status", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { status } = req.body as { status: "ACTIVE" | "SUSPENDED" };
  if (!["ACTIVE", "SUSPENDED"].includes(status)) {
    res.status(400).json({ error: "Status must be ACTIVE or SUSPENDED" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
