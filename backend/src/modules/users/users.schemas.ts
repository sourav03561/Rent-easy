import { z } from "zod";

const blankToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

export const updateProfileSchema = z.object({
  name: z.preprocess(blankToUndefined, z.string().trim().min(1).optional()),
  fullName: z.preprocess(blankToUndefined, z.string().trim().min(1).optional()),
  phone: z.preprocess(blankToUndefined, z.string().trim().min(5).max(20).optional()),
  avatarUrl: z.preprocess(blankToUndefined, z.string().trim().url().optional())
});

export const updateRoleSchema = z.object({
  role: z.enum(["STUDENT", "OWNER", "ADMIN"])
});
