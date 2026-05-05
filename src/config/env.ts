import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),

  BREVO_API_KEY: z.string().min(1, "BREVO_API_KEY is required"),
  BREVO_FROM_EMAIL: z.string().email("BREVO_FROM_EMAIL must be a valid email"),
  BREVO_FROM_NAME: z.string().min(1, "BREVO_FROM_NAME is required"),
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email"),

  BREVO_WAITLIST_LIST_ID: z.coerce.number().int().positive("BREVO_WAITLIST_LIST_ID is required"),
  WAITLIST_DAILY_SUMMARY_HOUR: z.coerce.number().int().min(0).max(23).default(18),

});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;