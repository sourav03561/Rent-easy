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

const listingSelectBase =
  "id, owner_id, title, type, city, address, price, amenities, photos, available, description, created_at";
const listingSelectWithVacancy =
  "id, owner_id, title, type, city, address, price, amenities, photos, available, vacant_rooms, description, created_at";

function isMissingVacancyColumn(error: { message?: string } | null | undefined) {
  return Boolean(error?.message?.includes("vacant_rooms"));
}

function withVacancyFallback<T extends object>(listing: T) {
  const maybeListing = listing as T & { available?: boolean; vacant_rooms?: number | null };

  return {
    ...listing,
    vacant_rooms: maybeListing.vacant_rooms ?? (maybeListing.available ? 1 : 0)
  };
}

listingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = validateQuery(listingSearchSchema, req);

    const buildRequest = (select: string) => {
      let request = supabase
        .from("listings")
        .select(select)
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

      return request;
    };

    let result: any = await buildRequest(listingSelectWithVacancy);

    if (isMissingVacancyColumn(result.error)) {
      result = await buildRequest(listingSelectBase);
    }

    if (result.error) {
      throw new AppError(result.error.message, 500);
    }

    res.json(successResponse("Listings fetched successfully", { listings: ((result.data ?? []) as object[]).map(withVacancyFallback) }));
  })
);

listingsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const listingId = routeParam(req, "id");
    let result: any = await supabase
      .from("listings")
      .select(listingSelectWithVacancy)
      .eq("id", listingId)
      .single();

    if (isMissingVacancyColumn(result.error)) {
      result = await supabase
        .from("listings")
        .select(listingSelectBase)
        .eq("id", listingId)
        .single();
    }

    if (result.error || !result.data) {
      throw notFound("Listing");
    }

    const listing = withVacancyFallback(result.data);

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

    const payload: Database["public"]["Tables"]["listings"]["Insert"] = {
      owner_id: user.id,
      title: body.title,
      type: body.type,
      city: body.city,
      address: body.address,
      price: body.price,
      vacant_rooms: body.vacantRooms,
      amenities: body.amenities,
      photos: body.photos,
      available: body.available && body.vacantRooms > 0,
      description: body.description
    };

    let result: any = await supabase
      .from("listings")
      .insert(payload)
      .select(listingSelectWithVacancy)
      .single();

    if (isMissingVacancyColumn(result.error)) {
      const { vacant_rooms: _vacantRooms, ...legacyPayload } = payload;
      result = await supabase
        .from("listings")
        .insert(legacyPayload)
        .select(listingSelectBase)
        .single();
    }

    if (result.error || !result.data) {
      throw new AppError(result.error?.message ?? "Unable to create listing", 500);
    }

    res.status(201).json(successResponse("Listing created successfully", { listing: withVacancyFallback(result.data) }));
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

    const nextAvailable =
      body.vacantRooms !== undefined ? (body.available ?? true) && body.vacantRooms > 0 : body.available;
    const updateData: Database["public"]["Tables"]["listings"]["Update"] = {
      title: body.title,
      type: body.type,
      city: body.city,
      address: body.address,
      price: body.price,
      vacant_rooms: body.vacantRooms,
      amenities: body.amenities,
      photos: body.photos,
      available: nextAvailable,
      description: body.description
    };

    let result: any = await supabase
      .from("listings")
      .update(updateData)
      .eq("id", listingId)
      .select(listingSelectWithVacancy)
      .single();

    if (isMissingVacancyColumn(result.error)) {
      const { vacant_rooms: _vacantRooms, ...legacyUpdateData } = updateData;
      result = await supabase
        .from("listings")
        .update(legacyUpdateData)
        .eq("id", listingId)
        .select(listingSelectBase)
        .single();
    }

    if (result.error || !result.data) {
      throw new AppError(result.error?.message ?? "Unable to update listing", 500);
    }

    res.json(successResponse("Listing updated successfully", { listing: withVacancyFallback(result.data) }));
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
