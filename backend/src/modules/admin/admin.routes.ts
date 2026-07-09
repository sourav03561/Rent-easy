import { Router } from "express";
import { AppError } from "../../common/app-error.js";
import { asyncHandler } from "../../common/async-handler.js";
import { routeParam } from "../../common/params.js";
import { successResponse } from "../../common/api-response.js";
import { supabase } from "../../config/supabase.js";
import { authenticate, authorize } from "../../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(authenticate, authorize("ADMIN"));

adminRouter.get(
  "/bookings",
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, listing_id, student_id, status, message, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json(successResponse("Bookings fetched successfully", { bookings: data ?? [] }));
  })
);

adminRouter.get(
  "/reviews",
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, listing_id, student_id, rating, comment, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json(successResponse("Reviews fetched successfully", { reviews: data ?? [] }));
  })
);

adminRouter.delete(
  "/reviews/:id",
  asyncHandler(async (req, res) => {
    const reviewId = routeParam(req, "id");
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json(successResponse("Review removed successfully", { id: reviewId }));
  })
);
