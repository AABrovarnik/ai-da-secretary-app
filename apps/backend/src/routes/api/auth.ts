import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../services/db.js";
import { appEnv } from "../../config/env.js";
import { generateAccessToken, hashToken } from "../../auth/tokens.js";
import { requireAuth } from "../../middleware/auth.js";

const { compare, hash } = bcrypt;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(120).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const authApiRouter = Router();

authApiRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    res.status(409).json({ error: "Email already exists" });
    return;
  }

  const passwordHash = await hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      displayName: parsed.data.displayName
    }
  });

  res.status(201).json({ id: user.id, email: user.email, displayName: user.displayName });
});

authApiRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const rawToken = generateAccessToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + appEnv.ACCESS_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt
    }
  });

  res.status(200).json({
    accessToken: rawToken,
    expiresAt: expiresAt.toISOString(),
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName
    }
  });
});

authApiRouter.post("/logout", requireAuth, async (req, res) => {
  if (!req.authSessionId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await prisma.session.update({
    where: { id: req.authSessionId },
    data: { revokedAt: new Date() }
  });

  res.status(204).send();
});
