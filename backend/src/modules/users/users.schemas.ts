import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  fullName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(5).max(20).optional(),
  avatarUrl: z.string().trim().url().optional()
});

export const updateRoleSchema = z.object({
  role: z.enum(["STUDENT", "OWNER", "ADMIN"])
});
