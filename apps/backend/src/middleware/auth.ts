import type { NextFunction, Request, Response } from "express";
import { prisma } from "../services/db.js";
import { hashToken } from "../auth/tokens.js";

declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      authSessionId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();
  const tokenHash = hashToken(token);

  const session = await prisma.session.findUnique({ where: { tokenHash } });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.authUserId = session.userId;
  req.authSessionId = session.id;
  next();
}