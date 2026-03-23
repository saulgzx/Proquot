import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { env } from "../env.js";
import { logger } from "../utils/logger.js";
import { sendError } from "../utils/response.js";

type ErrorWithStatus = Error & {
  status?: number;
  code?: string;
  details?: unknown;
};

export function errorMiddleware(
  error: ErrorWithStatus,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error(
    {
      err: error,
      code: error.code,
      details: error.details,
    },
    "Unhandled request error",
  );

  if (error instanceof ZodError) {
    sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Error de validación",
      error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
    return;
  }

  const status = error.status ?? 500;
  const details =
    env.NODE_ENV === "development" ? error.details ?? error.stack : error.details;

  sendError(
    res,
    status,
    (error.code as
      | "VALIDATION_ERROR"
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "UNAUTHORIZED"
      | "INTERNAL_ERROR") ?? "INTERNAL_ERROR",
    error.message || "Error interno del servidor",
    details,
  );
}
