import type { Request } from "express";
import type { AnyZodObject, ZodTypeAny } from "zod";
import { AppError } from "./app-error.js";

export function validateBody<T extends AnyZodObject>(schema: T, req: Request) {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    throw new AppError("Validation failed", 400, result.error.flatten().fieldErrors);
  }

  return result.data;
}

export function validateQuery<T extends ZodTypeAny>(schema: T, req: Request) {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    throw new AppError("Validation failed", 400, result.error.flatten().fieldErrors);
  }

  return result.data;
}
