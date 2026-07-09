import { z } from "zod";

export const listingTypeSchema = z.enum(["PG", "HOSTEL", "MESS"]);

export const createListingSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  type: listingTypeSchema,
  city: z.string().trim().min(1, "City is required"),
  address: z.string().trim().min(1, "Address is required"),
  price: z.coerce.number().int().positive("Price must be greater than zero"),
  amenities: z.array(z.string().trim().min(1)).default([]),
  photos: z.array(z.string().trim().url()).default([]),
  available: z.boolean().default(true),
  description: z.string().trim().optional()
});

export const updateListingSchema = createListingSchema.partial();

export const listingSearchSchema = z.object({
  city: z.string().trim().optional(),
  type: listingTypeSchema.optional(),
  minRent: z.coerce.number().int().positive().optional(),
  maxRent: z.coerce.number().int().positive().optional(),
  available: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional()
});
