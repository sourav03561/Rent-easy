import { Router } from "express";
import { AppError } from "../../common/app-error.js";
import { asyncHandler } from "../../common/async-handler.js";
import { successResponse } from "../../common/api-response.js";
import { supabase } from "../../config/supabase.js";
import { authenticate, authorize, requireUser } from "../../middleware/auth.js";

export const ownersRouter = Router();

ownersRouter.use(authenticate, authorize("OWNER", "ADMIN"));

ownersRouter.get(
  "/me/listings",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);

    const { data, error } = await supabase
      .from("listings")
      .select("id, owner_id, title, type, city, address, price, amenities, photos, available, description, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json(successResponse("Owner listings fetched successfully", { listings: data ?? [] }));
  })
);

ownersRouter.get(
  "/me/bookings",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);

    const { data: listings, error: listingsError } = await supabase
      .from("listings")
      .select("id")
      .eq("owner_id", user.id);

    if (listingsError) {
      throw new AppError(listingsError.message, 500);
    }

    const listingIds = (listings ?? []).map((listing) => listing.id);

    if (listingIds.length === 0) {
      res.json(successResponse("Owner bookings fetched successfully", { bookings: [] }));
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("id, listing_id, student_id, status, message, created_at")
      .in("listing_id", listingIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json(successResponse("Owner bookings fetched successfully", { bookings: data ?? [] }));
  })
);
