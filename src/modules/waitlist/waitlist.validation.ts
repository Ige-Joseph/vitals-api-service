import { z } from "zod";

export const createWaitlistSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .optional(),
  marketingConsent: z.boolean().refine((value) => value === true, {
    message: "You must agree to receive updates.",
  }),
});

export type CreateWaitlistSchemaType = z.infer<typeof createWaitlistSchema>;