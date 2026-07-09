import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    JWT_SECRET: z.string().min(16),
    JWT_EXPIRES_IN: z.string().default("7d"),
    FRONTEND_URL: z.string().url().optional(),
    FRONTEND_URLS: z.string().optional()
  })
  .transform((env) => ({
    ...env,
    FRONTEND_URLS:
      env.FRONTEND_URLS ??
      env.FRONTEND_URL ??
      "http://localhost:5173,http://127.0.0.1:5173"
  }));

export const env = envSchema.parse(process.env);
