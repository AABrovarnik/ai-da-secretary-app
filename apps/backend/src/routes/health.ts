import { Router } from "express";
import { checkDatabaseConnection } from "../services/db.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const db = await checkDatabaseConnection();
  const response = {
    status: db.ok ? "ok" : "degraded",
    service: "backend",
    checks: {
      process: { ok: true },
      database: db
    }
  } as const;

  res.status(db.ok ? 200 : 503).json(response);
});