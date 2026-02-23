const { z } = require("zod");

const createTribeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only"
    ),
  description: z.string().trim().max(300).optional(),
  emoji: z.string().max(4).optional(),
  category: z.string().trim().min(1).max(40).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

const listTribesSchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

module.exports = { createTribeSchema, listTribesSchema };
