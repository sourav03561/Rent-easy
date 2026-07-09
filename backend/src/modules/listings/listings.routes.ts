import { Router } from "express";
import { AppError, notFound } from "../../common/app-error.js";
import { asyncHandler } from "../../common/async-handler.js";
import { routeParam } from "../../common/params.js";
import { successResponse } from "../../common/api-response.js";
import { validateBody, validateQuery } from "../../common/validation.js";
import { supabase } from "../../config/supabase.js";
import { authenticate, authorize, requireUser } from "../../middleware/auth.js";
import type { Database } from "../../types/supabase.js";
import { createListingSchema, listingSearchSchema, updateListingSchema } from "./listings.schemas.js";

export const listingsRouter = Router();

listingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = validateQuery(listingSearchSchema, req);

    let request = supabase
      .from("listings")
      .select("id, owner_id, title, type, city, address, price, amenities, photos, available, description, created_at")
      .order("created_at", { ascending: false });

    if (query.city) {
      request = request.ilike("city", `%${query.city}%`);
    }

    if (query.type) {
      request = request.eq("type", query.type);
    }

    if (query.minRent) {
      request = request.gte("price", query.minRent);
    }

    if (query.maxRent) {
      request = request.lte("price", query.maxRent);
    }

    if (query.available !== undefined) {
      request = request.eq("available", query.available);
    }

    const { data, error } = await request;

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json(successResponse("Listings fetched successfully", { listings: data ?? [] }));
  })
);

listingsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const listingId = routeParam(req, "id");
    const { data: listing, error } = await supabase
      .from("listings")
      .select("id, owner_id, title, type, city, address, price, amenities, photos, available, description, created_at")
      .eq("id", listingId)
      .single();

    if (error || !listing) {
      throw notFound("Listing");
    }

    const { data: reviews } = await supabase
      .from("reviews")
      .select("id, listing_id, student_id, rating, comment, created_at")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });

    res.json(successResponse("Listing fetched successfully", { listing, reviews: reviews ?? [] }));
  })
);

listingsRouter.post(
  "/",
  authenticate,
  authorize("OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const body = validateBody(createListingSchema, req);

    const { data, error } = await supabase
      .from("listings")
      .insert({
        owner_id: user.id,
        title: body.title,
        type: body.type,
        city: body.city,
        address: body.address,
        price: body.price,
        amenities: body.amenities,
        photos: body.photos,
        available: body.available,
        description: body.description
      })
      .select("id, owner_id, title, type, city, address, price, amenities, photos, available, description, created_at")
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? "Unable to create listing", 500);
    }

    res.status(201).json(successResponse("Listing created successfully", { listing: data }));
  })
);

listingsRouter.patch(
  "/:id",
  authenticate,
  authorize("OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const body = validateBody(updateListingSchema, req);
    const listingId = routeParam(req, "id");

    const { data: listing, error: findError } = await supabase
      .from("listings")
      .select("id, owner_id")
      .eq("id", listingId)
      .single();

    if (findError || !listing) {
      throw notFound("Listing");
    }

    if (user.role !== "ADMIN" && listing.owner_id !== user.id) {
      throw new AppError("You can only update your own listings", 403);
    }

    const updateData: Database["public"]["Tables"]["listings"]["Update"] = {
      title: body.title,
      type: body.type,
      city: body.city,
      address: body.address,
      price: body.price,
      amenities: body.amenities,
      photos: body.photos,
      available: body.available,
      description: body.description
    };

    const { data, error } = await supabase
      .from("listings")
      .update(updateData)
      .eq("id", listingId)
      .select("id, owner_id, title, type, city, address, price, amenities, photos, available, description, created_at")
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? "Unable to update listing", 500);
    }

    res.json(successResponse("Listing updated successfully", { listing: data }));
  })
);

listingsRouter.delete(
  "/:id",
  authenticate,
  authorize("OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const listingId = routeParam(req, "id");

    const { data: listing, error: findError } = await supabase
      .from("listings")
      .select("id, owner_id")
      .eq("id", listingId)
      .single();

    if (findError || !listing) {
      throw notFound("Listing");
    }

    if (user.role !== "ADMIN" && listing.owner_id !== user.id) {
      throw new AppError("You can only delete your own listings", 403);
    }

    const { error } = await supabase.from("listings").delete().eq("id", listingId);

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json(successResponse("Listing deleted successfully", { id: listingId }));
  })
);
