import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

let createApp: () => import("express").Express;

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://secretary:secretary@localhost:5432/aidasecretary?schema=public";
  process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? "test-session-secret-value";
  const appModule = await import("../src/app.js");
  createApp = appModule.createApp;
}, 30_000);

describe("GET /health", () => {
  it("returns liveness and readiness fields", async () => {
    const app = createApp();

    const response = await request(app).get("/health");

    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty("service", "backend");
    expect(response.body).toHaveProperty("checks.process.ok", true);
    expect(response.body).toHaveProperty("checks.database.ok");
  });
});