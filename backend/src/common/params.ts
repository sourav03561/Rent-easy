import type { Request } from "express";
import { AppError } from "./app-error.js";

export function routeParam(req: Request, name: string) {
  const value = req.params[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(`Route parameter ${name} is required`, 400);
  }

  return value;
}
