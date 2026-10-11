import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 chars").default("dev-secret-key-change-me"),
  ACCESS_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(8),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-6.1-sol"),
  ASR_MODEL: z.string().default("whisper-1"),
  LOCAL_AUDIO_STORAGE_PATH: z.string().default("./storage/audio"),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(50)
});

export type AppEnv = z.infer<typeof envSchema>;
export const appEnv: AppEnv = envSchema.parse(process.env);