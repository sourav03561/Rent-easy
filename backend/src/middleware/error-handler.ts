import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../common/app-error.js";
import { errorResponse } from "../common/api-response.js";
import { env } from "../config/env.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json(errorResponse("Validation failed", [error.flatten().fieldErrors]));
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json(errorResponse(error.message, error.errors));
    return;
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  const responseMessage = env.NODE_ENV === "production" ? "Internal server error" : message;

  res.status(500).json(errorResponse(responseMessage));
}
