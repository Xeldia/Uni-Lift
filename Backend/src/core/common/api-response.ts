import type { Response } from "express";
import { HttpError } from "../exception/http-error.js";

export function sendError(res: Response, statusCode: number, message: string, details?: unknown) {
  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message,
      details: details ?? null,
    },
    timestamp: new Date().toISOString(),
  });
}

export function sendSuccess(res: Response, data: unknown, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  });
}

export function handleControllerError(error: unknown, res: Response) {
  if (error instanceof HttpError) {
    sendError(res, error.statusCode, error.message);
    return;
  }
  sendError(res, 500, "Internal server error");
}

export function requireString(
  value: unknown,
  fieldName: string,
  {
    minLength = 1,
    allowEmpty = false,
  }: { minLength?: number; allowEmpty?: boolean } = {}
) {
  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} must be a string`);
  }
  const normalized = value.trim();
  if (!allowEmpty && normalized.length < minLength) {
    throw new HttpError(400, `${fieldName} is required`);
  }
  return normalized;
}
