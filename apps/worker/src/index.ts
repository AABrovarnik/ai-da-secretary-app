import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import express from "express";
import { z } from "zod";

config();

const env = z
  .object({
    WORKER_PORT: z.coerce.number().int().positive().default(4010)
  })
  .parse(process.env);

const prisma = new PrismaClient();
const app = express();

app.get("/health", async (_req, res) => {
  let database = { ok: true as boolean, error: undefined as string | undefined };
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    database = {
      ok: false,
      error: error instanceof Error ? error.message : "unknown database error"
    };
  }

  const status = database.ok ? "ok" : "degraded";
  res.status(database.ok ? 200 : 503).json({
    status,
    service: "worker",
    checks: {
      process: { ok: true },
      database
    }
  });
});

app.listen(env.WORKER_PORT, () => {
  console.log(`worker listening on http://localhost:${env.WORKER_PORT}`);
});