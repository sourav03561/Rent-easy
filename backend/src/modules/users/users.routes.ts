import { Router } from "express";
import { AppError, notFound } from "../../common/app-error.js";
import { asyncHandler } from "../../common/async-handler.js";
import { routeParam } from "../../common/params.js";
import { successResponse } from "../../common/api-response.js";
import { validateBody } from "../../common/validation.js";
import { supabase } from "../../config/supabase.js";
import { authenticate, authorize, requireUser } from "../../middleware/auth.js";
import { updateProfileSchema, updateRoleSchema } from "./users.schemas.js";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, avatar_url, created_at")
      .eq("id", user.id)
      .maybeSingle();

    res.json(successResponse("Profile fetched successfully", { user, profile }));
  })
);

usersRouter.patch(
  "/me",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const body = validateBody(updateProfileSchema, req);

    const nextName = body.name ?? body.fullName;
    const profilePayload = {
      id: user.id,
      full_name: nextName ?? user.name,
      email: user.email,
      role: user.role,
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.avatarUrl !== undefined ? { avatar_url: body.avatarUrl } : {})
    };

    if (nextName) {
      const { error: userError } = await supabase
        .from("users")
        .update({ name: nextName })
        .eq("id", user.id);

      if (userError) {
        throw new AppError(userError.message, 500);
      }
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .upsert(profilePayload)
      .select("id, full_name, email, phone, role, avatar_url, created_at")
      .single();

    if (error || !profile) {
      throw new AppError(error?.message ?? "Unable to update profile", 500);
    }

    res.json(successResponse("Profile updated successfully", { profile }));
  })
);

usersRouter.get(
  "/",
  authorize("ADMIN"),
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json(successResponse("Users fetched successfully", { users: data ?? [] }));
  })
);

usersRouter.patch(
  "/:id/role",
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const body = validateBody(updateRoleSchema, req);
    const userId = routeParam(req, "id");

    const { data, error } = await supabase
      .from("users")
      .update({ role: body.role })
      .eq("id", userId)
      .select("id, name, email, role, created_at")
      .single();

    if (error || !data) {
      throw notFound("User");
    }

    await supabase.from("profiles").update({ role: body.role }).eq("id", userId);

    res.json(successResponse("User role updated successfully", { user: data }));
  })
);

usersRouter.delete(
  "/:id",
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const userId = routeParam(req, "id");
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json(successResponse("User deleted successfully", { id: userId }));
  })
);
