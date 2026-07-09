import type { NextFunction, Request, Response } from "express";
import { AppError } from "../common/app-error.js";
import { verifyToken } from "../common/jwt.js";
import { supabase } from "../config/supabase.js";
import type { AuthUser, UserRole } from "../types/auth.js";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new AppError("Authentication token is required", 401);
    }

    const token = header.slice("Bearer ".length);
    const payload = verifyToken(token);

    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role")
      .eq("id", payload.sub)
      .single();

    if (error || !data) {
      throw new AppError("Invalid or expired token", 401);
    }

    req.user = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError("Authentication token is required", 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError("You do not have permission to perform this action", 403));
      return;
    }

    next();
  };
}

export function requireUser(req: Request): AuthUser {
  if (!req.user) {
    throw new AppError("Authentication token is required", 401);
  }

  return req.user;
}
