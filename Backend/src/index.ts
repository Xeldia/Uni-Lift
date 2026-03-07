import "dotenv/config";
import express from "express";
import cors from "cors";

import usersRouter from "./routes/users.js";
import ridesRouter from "./routes/rides.js";
import verificationsRouter from "./routes/verifications.js";
import sosRouter from "./routes/sos.js";

const app = express();
const PORT = process.env.PORT ?? 3001;
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",");

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "UniLift API", timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/users", usersRouter);
app.use("/api/rides", ridesRouter);
app.use("/api/verifications", verificationsRouter);
app.use("/api/sos", sosRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  UniLift API running at http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/health\n`);
});
