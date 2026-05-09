import "dotenv/config";
import express from "express";
import cors from "cors";

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
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) callback(null, true);
    else callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
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

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  sendError(res, 404, "Route not found");
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  [BACKEND] ✅ Server is active at http://localhost:${PORT}`);
  console.log(`  [BACKEND] 📊 Health check: http://localhost:${PORT}/health\n`);
});
