import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health.js";
import { authApiRouter } from "./routes/api/auth.js";
import { meetingsApiRouter } from "./routes/api/meetings.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/", (_req, res) => {
    res.json({
      name: "AI-да-Секретарь API",
      stage: "1.2-foundation",
      aiConfigured: false,
      message: "Configure OPENAI_API_KEY for real AI extraction"
    });
  });

  app.use(healthRouter);
  app.use("/api/auth", authApiRouter);
  app.use("/api/meetings", meetingsApiRouter);

  return app;
}