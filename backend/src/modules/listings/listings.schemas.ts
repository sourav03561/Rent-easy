import { z } from "zod";

export const listingTypeSchema = z.enum(["PG", "HOSTEL", "MESS"]);

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

export const createListingSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  type: listingTypeSchema,
  city: z.string().trim().min(1, "City is required"),
  address: z.string().trim().min(1, "Address is required"),
  price: z.coerce.number().int().positive("Price must be greater than zero"),
  vacantRooms: z.coerce.number().int().min(0, "Vacant rooms cannot be negative").default(1),
  amenities: z.array(z.string().trim().min(1)).default([]),
  photos: z.array(z.string().trim().url()).default([]),
  available: z.boolean().default(true),
  description: z.string().trim().optional()
});

export const updateListingSchema = createListingSchema.partial();

export const listingSearchSchema = z.object({
  city: z.preprocess(emptyStringToUndefined, z.string().trim().optional()),
  type: z.preprocess(emptyStringToUndefined, listingTypeSchema.optional()),
  minRent: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().optional()),
  maxRent: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().optional()),
  available: z.preprocess(
    emptyStringToUndefined,
    z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional()
  )
});
