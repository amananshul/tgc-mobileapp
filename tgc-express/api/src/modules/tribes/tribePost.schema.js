const { z } = require("zod");

const createTribePostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(2000, "Content must be 2000 characters or less"),
  imageUrl: z
    .union([z.string().trim().url("imageUrl must be a valid URL"), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
});

module.exports = { createTribePostSchema };
