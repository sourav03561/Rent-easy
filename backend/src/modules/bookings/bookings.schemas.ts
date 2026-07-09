import { z } from "zod";

export const createBookingSchema = z.object({
  listingId: z.string().uuid("Listing id must be a valid UUID"),
  message: z.string().trim().max(500).optional()
});
