import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

import usersRouter from "./features/users/users.controller.js";
import ridesRouter from "./features/rides/rides.controller.js";
import verificationsRouter from "./features/admin/verifications/verifications.controller.js";
import sosRouter from "./features/admin/sos/sos.controller.js";
import { sendError, sendSuccess } from "./core/common/api-response.js";

const app = express();
const PORT = process.env.PORT ?? 3001;
const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

// ─── Middleware ───────────────────────────────────────────────────────────────
const apiCors = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) callback(null, true);
    else callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
});
// Apply CORS only to API routes. Static frontend assets should not be blocked by CORS checks.
app.use("/api", apiCors);
app.use(express.json({ limit: "10mb" }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  sendSuccess(res, { status: "ok", service: "UniLift API" });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/users", usersRouter);
app.use("/api/rides", ridesRouter);
app.use("/api/verifications", verificationsRouter);
app.use("/api/sos", sosRouter);

// Explicit API 404 (don't fall through to SPA index)
app.use("/api", (_req, res) => {
  sendError(res, 404, "API route not found");
});

// ─── Frontend static files (production) ──────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidateStaticDirs = [
  path.join(__dirname, "..", "public"),          // Docker runtime (/app/public)
  path.join(process.cwd(), "public"),            // direct runtime in repo root
  path.join(process.cwd(), "Frontend", "dist"),  // non-docker monorepo run
];
const staticDir = candidateStaticDirs.find((dir) => existsSync(path.join(dir, "index.html")));

if (staticDir) {
  app.use(express.static(staticDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
} else {
  console.warn("[BACKEND] No frontend build found. Checked:", candidateStaticDirs);
}

// ─── Global 404 fallback ──────────────────────────────────────────────────────
app.use((_req, res) => {
  sendError(res, 404, "Route not found");
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  [BACKEND] ✅ Server is active at http://localhost:${PORT}`);
  console.log(`  [BACKEND] 📊 Health check: http://localhost:${PORT}/health\n`);
});
