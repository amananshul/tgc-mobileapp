import { z } from "zod";

const createTribePostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(2000, "Content must be 2000 characters or less"),
  imagePath: z
    .union([z.string().trim().min(1, "imagePath is required"), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export { createTribePostSchema };
