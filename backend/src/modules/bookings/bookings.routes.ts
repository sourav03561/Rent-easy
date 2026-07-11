import { Router } from "express";
import { AppError, notFound } from "../../common/app-error.js";
import { asyncHandler } from "../../common/async-handler.js";
import { routeParam } from "../../common/params.js";
import { successResponse } from "../../common/api-response.js";
import { validateBody } from "../../common/validation.js";
import { supabase } from "../../config/supabase.js";
import { authenticate, authorize, requireUser } from "../../middleware/auth.js";
import { createBookingSchema } from "./bookings.schemas.js";

export const bookingsRouter = Router();

bookingsRouter.use(authenticate);

const bookingSelectBase = "id, listing_id, student_id, status, message, created_at";
const bookingSelectWithCompleted = "id, listing_id, student_id, status, message, completed_at, created_at";

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

async function fetchBooking(bookingId: string) {
  let result: any = await supabase
    .from("bookings")
    .select(bookingSelectWithCompleted)
    .eq("id", bookingId)
    .single();

  if (isMissingColumn(result.error, "completed_at")) {
    result = await supabase
      .from("bookings")
      .select(bookingSelectBase)
      .eq("id", bookingId)
      .single();
  }

  return result;
}

async function fetchListingForBooking(listingId: string) {
  let result: any = await supabase
    .from("listings")
    .select("id, owner_id, available, vacant_rooms")
    .eq("id", listingId)
    .single();

  if (isMissingColumn(result.error, "vacant_rooms")) {
    const legacyResult = await supabase
      .from("listings")
      .select("id, owner_id, available")
      .eq("id", listingId)
      .single();

    return {
      data: legacyResult.data ? { ...legacyResult.data, vacant_rooms: legacyResult.data.available ? 1 : 0 } : null,
      error: legacyResult.error,
      supportsVacancy: false
    };
  }

  return {
    data: result.data,
    error: result.error,
    supportsVacancy: true
  };
}

bookingsRouter.post(
  "/",
  authorize("STUDENT"),
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const body = validateBody(createBookingSchema, req);

    const { data: listing, error: listingError } = await fetchListingForBooking(body.listingId);

    if (listingError || !listing) {
      throw notFound("Listing");
    }

    if (!listing.available) {
      throw new AppError("This listing is not currently available", 409);
    }

    if (listing.vacant_rooms <= 0) {
      throw new AppError("There are no vacant rooms for this listing", 409);
    }

    if (listing.owner_id === user.id) {
      throw new AppError("You cannot book your own listing", 400);
    }

    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("listing_id", body.listingId)
      .eq("student_id", user.id)
      .in("status", ["PENDING", "APPROVED"])
      .maybeSingle();

    if (existingBooking) {
      throw new AppError("You already have an active booking for this listing", 409);
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        listing_id: body.listingId,
        student_id: user.id,
        message: body.message,
        status: "PENDING"
      })
      .select(bookingSelectBase)
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? "Unable to create booking", 500);
    }

    res.status(201).json(successResponse("Booking request created successfully", { booking: withCompletedAtFallback(data) }));
  })
);

bookingsRouter.get(
  "/me",
  authorize("STUDENT"),
  asyncHandler(async (req, res) => {
    const user = requireUser(req);

    let result: any = await supabase
      .from("bookings")
      .select(bookingSelectWithCompleted)
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    if (isMissingColumn(result.error, "completed_at")) {
      result = await supabase
        .from("bookings")
        .select(bookingSelectBase)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
    }

    if (result.error) {
      throw new AppError(result.error.message, 500);
    }

    res.json(successResponse("Bookings fetched successfully", { bookings: ((result.data ?? []) as object[]).map(withCompletedAtFallback) }));
  })
);

bookingsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const bookingId = routeParam(req, "id");

    const { data: booking, error } = await fetchBooking(bookingId);

    if (error || !booking) {
      throw notFound("Booking");
    }

    const { data: listing } = await supabase
      .from("listings")
      .select("id, owner_id, title, city, address, price")
      .eq("id", booking.listing_id)
      .single();

    const canView =
      user.role === "ADMIN" || booking.student_id === user.id || listing?.owner_id === user.id;

    if (!canView) {
      throw new AppError("You can only view your own bookings", 403);
    }

    res.json(successResponse("Booking fetched successfully", { booking: withCompletedAtFallback(booking), listing }));
  })
);

bookingsRouter.patch(
  "/:id/cancel",
  authorize("STUDENT"),
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const bookingId = routeParam(req, "id");

    const { data: booking, error: findError } = await supabase
      .from("bookings")
      .select("id, listing_id, student_id, status")
      .eq("id", bookingId)
      .single();

    if (findError || !booking) {
      throw notFound("Booking");
    }

    if (booking.student_id !== user.id) {
      throw new AppError("You can only cancel your own bookings", 403);
    }

    if (booking.status !== "PENDING") {
      throw new AppError("Only pending bookings can be cancelled", 400);
    }

    const { data, error } = await supabase
      .from("bookings")
      .update({ status: "CANCELLED" })
      .eq("id", bookingId)
      .select(bookingSelectBase)
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? "Unable to cancel booking", 500);
    }

    res.json(successResponse("Booking cancelled successfully", { booking: withCompletedAtFallback(data) }));
  })
);

async function updateOwnerBookingStatus(
  bookingId: string,
  ownerId: string,
  status: "APPROVED" | "REJECTED"
) {
  const { data: booking, error: bookingError } = await fetchBooking(bookingId);

  if (bookingError || !booking) {
    throw notFound("Booking");
  }

  const { data: listing, error: listingError, supportsVacancy } = await fetchListingForBooking(booking.listing_id);

  if (listingError || !listing) {
    throw notFound("Listing");
  }

  if (listing.owner_id !== ownerId) {
    throw new AppError("You can only manage bookings for your own listings", 403);
  }

  if (booking.status !== "PENDING") {
    throw new AppError("Only pending bookings can be approved or rejected", 400);
  }

  if (status === "APPROVED" && !listing.available) {
    throw new AppError("This listing is no longer available", 409);
  }

  if (status === "APPROVED" && listing.vacant_rooms <= 0) {
    throw new AppError("There are no vacant rooms for this listing", 409);
  }

  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .select(bookingSelectBase)
    .single();

  if (error || !data) {
    throw new AppError(error?.message ?? "Unable to update booking", 500);
  }

  if (status === "APPROVED") {
    if (supportsVacancy) {
      const nextVacantRooms = Math.max(0, listing.vacant_rooms - 1);
      await supabase
        .from("listings")
        .update({ vacant_rooms: nextVacantRooms, available: nextVacantRooms > 0 })
        .eq("id", booking.listing_id);
    } else {
      await supabase.from("listings").update({ available: false }).eq("id", booking.listing_id);
    }
  }

  return withCompletedAtFallback(data);
}

bookingsRouter.patch(
  "/:id/approve",
  authorize("OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const booking = await updateOwnerBookingStatus(routeParam(req, "id"), user.id, "APPROVED");

    res.json(successResponse("Booking approved successfully", { booking }));
  })
);

bookingsRouter.patch(
  "/:id/reject",
  authorize("OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const booking = await updateOwnerBookingStatus(routeParam(req, "id"), user.id, "REJECTED");

    res.json(successResponse("Booking rejected successfully", { booking }));
  })
);

bookingsRouter.patch(
  "/:id/complete",
  authorize("OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const bookingId = routeParam(req, "id");

    const { data: booking, error: bookingError } = await fetchBooking(bookingId);

    if (bookingError || !booking) {
      throw notFound("Booking");
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, owner_id")
      .eq("id", booking.listing_id)
      .single();

    if (listingError || !listing) {
      throw notFound("Listing");
    }

    if (user.role !== "ADMIN" && listing.owner_id !== user.id) {
      throw new AppError("You can only complete bookings for your own listings", 403);
    }

    if (booking.status !== "APPROVED") {
      throw new AppError("Only approved bookings can be marked completed", 400);
    }

    let result: any = await supabase
      .from("bookings")
      .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
      .eq("id", bookingId)
      .select(bookingSelectWithCompleted)
      .single();

    if (isMissingColumn(result.error, "completed_at")) {
      result = await supabase
        .from("bookings")
        .update({ status: "COMPLETED" })
        .eq("id", bookingId)
        .select(bookingSelectBase)
        .single();
    }

    if (result.error || !result.data) {
      throw new AppError(result.error?.message ?? "Unable to complete booking", 500);
    }

    res.json(successResponse("Booking completed successfully", { booking: withCompletedAtFallback(result.data) }));
  })
);
