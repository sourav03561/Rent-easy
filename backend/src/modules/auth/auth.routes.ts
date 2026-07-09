import bcrypt from "bcryptjs";
import { Router } from "express";
import { AppError } from "../../common/app-error.js";
import { asyncHandler } from "../../common/async-handler.js";
import { signToken } from "../../common/jwt.js";
import { successResponse } from "../../common/api-response.js";
import { validateBody } from "../../common/validation.js";
import { supabase } from "../../config/supabase.js";
import { authRateLimiter } from "../../middleware/rate-limit.js";
import type { AuthUser, UserRole } from "../../types/auth.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const body = validateBody(registerSchema, req);

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", body.email)
      .maybeSingle();

    if (existingUser) {
      throw new AppError("Email is already registered", 409);
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const { data: createdUser, error } = await supabase
      .from("users")
      .insert({
        name: body.name,
        email: body.email,
        password: passwordHash,
        role: body.role
      })
      .select("id, name, email, role")
      .single();

    if (error || !createdUser) {
      throw new AppError(error?.message ?? "Unable to register user", 500);
    }

    await supabase.from("profiles").upsert({
      id: createdUser.id,
      full_name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role
    });

    const user: AuthUser = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role as UserRole
    };

    res.status(201).json(
      successResponse("Registration successful", {
        user,
        token: signToken(user)
      })
    );
  })
);

authRouter.post(
  "/login",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const body = validateBody(loginSchema, req);

    const { data: userRecord, error } = await supabase
      .from("users")
      .select("id, name, email, password, role")
      .eq("email", body.email)
      .single();

    if (error || !userRecord) {
      throw new AppError("Invalid email or password", 401);
    }

    const passwordMatches = await bcrypt.compare(body.password, userRecord.password);

    if (!passwordMatches) {
      throw new AppError("Invalid email or password", 401);
    }

    const user: AuthUser = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role as UserRole
    };

    res.json(
      successResponse("Login successful", {
        user,
        token: signToken(user)
      })
    );
  })
);
