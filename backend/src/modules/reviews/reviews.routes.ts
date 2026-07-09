import { Router } from "express";
import { AppError, notFound } from "../../common/app-error.js";
import { asyncHandler } from "../../common/async-handler.js";
import { routeParam } from "../../common/params.js";
import { successResponse } from "../../common/api-response.js";
import { validateBody } from "../../common/validation.js";
import { supabase } from "../../config/supabase.js";
import { authenticate, authorize, requireUser } from "../../middleware/auth.js";
import { createReviewSchema } from "./reviews.schemas.js";

export const reviewsRouter = Router({ mergeParams: true });

reviewsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const listingId = routeParam(req, "listingId");
    const { data, error } = await supabase
      .from("reviews")
      .select("id, listing_id, student_id, rating, comment, created_at")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json(successResponse("Reviews fetched successfully", { reviews: data ?? [] }));
  })
);

reviewsRouter.post(
  "/",
  authenticate,
  authorize("STUDENT"),
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const body = validateBody(createReviewSchema, req);
    const listingId = routeParam(req, "listingId");

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      throw notFound("Listing");
    }

    const { data: eligibleBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("listing_id", listingId)
      .eq("student_id", user.id)
      .in("status", ["APPROVED", "COMPLETED"])
      .maybeSingle();

    if (!eligibleBooking) {
      throw new AppError("Only students with an approved or completed booking can review", 403);
    }

    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("listing_id", listingId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (existingReview) {
      throw new AppError("You have already reviewed this listing", 409);
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        listing_id: listingId,
        student_id: user.id,
        rating: body.rating,
        comment: body.comment
      })
      .select("id, listing_id, student_id, rating, comment, created_at")
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? "Unable to create review", 500);
    }

    res.status(201).json(successResponse("Review submitted successfully", { review: data }));
  })
);
