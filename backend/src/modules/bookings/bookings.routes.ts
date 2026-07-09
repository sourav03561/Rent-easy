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

bookingsRouter.post(
  "/",
  authorize("STUDENT"),
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const body = validateBody(createBookingSchema, req);

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, owner_id, available")
      .eq("id", body.listingId)
      .single();

    if (listingError || !listing) {
      throw notFound("Listing");
    }

    if (!listing.available) {
      throw new AppError("This listing is not currently available", 409);
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
      .select("id, listing_id, student_id, status, message, created_at")
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? "Unable to create booking", 500);
    }

    res.status(201).json(successResponse("Booking request created successfully", { booking: data }));
  })
);

bookingsRouter.get(
  "/me",
  authorize("STUDENT"),
  asyncHandler(async (req, res) => {
    const user = requireUser(req);

    const { data, error } = await supabase
      .from("bookings")
      .select("id, listing_id, student_id, status, message, created_at")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json(successResponse("Bookings fetched successfully", { bookings: data ?? [] }));
  })
);

bookingsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const bookingId = routeParam(req, "id");

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, listing_id, student_id, status, message, created_at")
      .eq("id", bookingId)
      .single();

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

    res.json(successResponse("Booking fetched successfully", { booking, listing }));
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
      .select("id, listing_id, student_id, status, message, created_at")
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? "Unable to cancel booking", 500);
    }

    res.json(successResponse("Booking cancelled successfully", { booking: data }));
  })
);

async function updateOwnerBookingStatus(
  bookingId: string,
  ownerId: string,
  status: "APPROVED" | "REJECTED"
) {
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, listing_id, student_id, status, message, created_at")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    throw notFound("Booking");
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, owner_id, available")
    .eq("id", booking.listing_id)
    .single();

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

  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .select("id, listing_id, student_id, status, message, created_at")
    .single();

  if (error || !data) {
    throw new AppError(error?.message ?? "Unable to update booking", 500);
  }

  if (status === "APPROVED") {
    await supabase.from("listings").update({ available: false }).eq("id", booking.listing_id);
  }

  return data;
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
