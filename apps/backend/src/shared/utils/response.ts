import type { Response } from "express";

type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR";

export function sendSuccess<T>(res: Response, data: T, meta?: unknown): Response {
  return res.status(200).json({
    success: true,
    data,
    ...(meta !== undefined ? { meta } : {}),
  });
}

export function sendError(
  res: Response,
  status: number,
  code: ErrorCode,
  message: string,
  details?: unknown,
): Response {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  });
}
