import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase.config.js";

// Attach the authenticated Supabase user to req for downstream handlers
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  (req as any).user = user;
  next();
}

// Admin-only guard - checks user metadata for role = "admin"
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user?.id) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  // Use DB role (public.users.role) as the source of truth.
  // user_metadata is not reliable and is writable by the client.
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: "Failed to check admin role" });
    return;
  }

  const role = (data?.role ?? "").toString().toUpperCase();
  if (role !== "ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
}
