import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { and, eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { sesiones } from "../../db/schema.js";
import { env } from "../env.js";
import { sendError } from "../utils/response.js";

type JwtPayload = {
  userId: number;
  usuario: string;
  role: string;
};

type AuthUser = {
  id: number;
  usuario: string;
  role: string;
  sessionId: string;
  deviceId: string | null;
};

export type AuthRequest = Request & {
  user?: AuthUser;
};

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
}

function isSessionExpired(lastSeen: Date, role: string): boolean {
  const ttlMinutes = role === "admin" ? env.ADMIN_SESSION_TTL_MIN : env.SESSION_TTL_MIN;
  return Date.now() - lastSeen.getTime() > ttlMinutes * 60 * 1000;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractBearerToken(req);
  const sessionId = req.header("X-Session-Id");

  if (!token || !sessionId) {
    sendError(res, 401, "UNAUTHORIZED", "Token o sesión no provistos");
    return;
  }

  let payload: JwtPayload;

  try {
    payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    sendError(res, 401, "UNAUTHORIZED", "Token inválido o expirado");
    return;
  }

  const [session] = await db
    .select({
      id: sesiones.id,
      userId: sesiones.userId,
      sessionId: sesiones.sessionId,
      deviceId: sesiones.deviceId,
      lastSeen: sesiones.lastSeen,
      revoked: sesiones.revoked,
    })
    .from(sesiones)
    .where(and(eq(sesiones.userId, payload.userId), eq(sesiones.sessionId, sessionId)))
    .limit(1);

  if (!session || session.revoked) {
    sendError(res, 401, "UNAUTHORIZED", "Sesión inválida o revocada");
    return;
  }

  if (isSessionExpired(session.lastSeen, payload.role)) {
    sendError(res, 401, "UNAUTHORIZED", "La sesión expiró");
    return;
  }

  await db
    .update(sesiones)
    .set({
      lastSeen: new Date(),
    })
    .where(eq(sesiones.id, session.id));

  req.user = {
    id: payload.userId,
    usuario: payload.usuario,
    role: payload.role,
    sessionId: session.sessionId,
    deviceId: session.deviceId,
  };

  next();
}

export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      sendError(res, 403, "FORBIDDEN", "Acceso restringido a administradores");
      return;
    }

    next();
  });
}
