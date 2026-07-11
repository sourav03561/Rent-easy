import { Router } from "express";
import { AppError } from "../../common/app-error.js";
import { asyncHandler } from "../../common/async-handler.js";
import { routeParam } from "../../common/params.js";
import { successResponse } from "../../common/api-response.js";
import { supabase } from "../../config/supabase.js";
import { authenticate, authorize } from "../../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(authenticate, authorize("ADMIN"));

function isMissingColumn(error: { message?: string } | null | undefined, column: string) {
  return Boolean(error?.message?.includes(column));
}

function withCompletedAtFallback<T extends object>(booking: T) {
  const maybeBooking = booking as T & { completed_at?: string | null };

  return {
    ...booking,
    completed_at: maybeBooking.completed_at ?? null
  };
}

adminRouter.get(
  "/bookings",
  asyncHandler(async (_req, res) => {
    let result: any = await supabase
      .from("bookings")
      .select("id, listing_id, student_id, status, message, completed_at, created_at")
      .order("created_at", { ascending: false });

    if (isMissingColumn(result.error, "completed_at")) {
      result = await supabase
        .from("bookings")
        .select("id, listing_id, student_id, status, message, created_at")
        .order("created_at", { ascending: false });
    }

    if (result.error) {
      throw new AppError(result.error.message, 500);
    }

    res.json(successResponse("Bookings fetched successfully", { bookings: ((result.data ?? []) as object[]).map(withCompletedAtFallback) }));
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
