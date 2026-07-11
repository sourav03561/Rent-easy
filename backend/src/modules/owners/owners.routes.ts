import { Router } from "express";
import { AppError } from "../../common/app-error.js";
import { asyncHandler } from "../../common/async-handler.js";
import { successResponse } from "../../common/api-response.js";
import { supabase } from "../../config/supabase.js";
import { authenticate, authorize, requireUser } from "../../middleware/auth.js";

export const ownersRouter = Router();

ownersRouter.use(authenticate, authorize("OWNER", "ADMIN"));

function isMissingColumn(error: { message?: string } | null | undefined, column: string) {
  return Boolean(error?.message?.includes(column));
}

function withVacancyFallback<T extends object>(listing: T) {
  const maybeListing = listing as T & { available?: boolean; vacant_rooms?: number | null };

  return {
    ...listing,
    vacant_rooms: maybeListing.vacant_rooms ?? (maybeListing.available ? 1 : 0)
  };
}

function withCompletedAtFallback<T extends object>(booking: T) {
  const maybeBooking = booking as T & { completed_at?: string | null };

  return {
    ...booking,
    completed_at: maybeBooking.completed_at ?? null
  };
}

ownersRouter.get(
  "/me/listings",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);

    let result: any = await supabase
      .from("listings")
      .select("id, owner_id, title, type, city, address, price, amenities, photos, available, vacant_rooms, description, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (isMissingColumn(result.error, "vacant_rooms")) {
      result = await supabase
        .from("listings")
        .select("id, owner_id, title, type, city, address, price, amenities, photos, available, description, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
    }

    if (result.error) {
      throw new AppError(result.error.message, 500);
    }

    res.json(successResponse("Owner listings fetched successfully", { listings: ((result.data ?? []) as object[]).map(withVacancyFallback) }));
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

    let result: any = await supabase
      .from("bookings")
      .select("id, listing_id, student_id, status, message, completed_at, created_at")
      .in("listing_id", listingIds)
      .order("created_at", { ascending: false });

    if (isMissingColumn(result.error, "completed_at")) {
      result = await supabase
        .from("bookings")
        .select("id, listing_id, student_id, status, message, created_at")
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false });
    }

    if (result.error) {
      throw new AppError(result.error.message, 500);
    }

    res.json(successResponse("Owner bookings fetched successfully", { bookings: ((result.data ?? []) as object[]).map(withCompletedAtFallback) }));
  })
);
