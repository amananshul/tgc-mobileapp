import { z } from "zod";

const createTribeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60),
  description: z.string().trim().max(300).optional(),
  coverImagePath: z.string().trim().min(1).max(1024).optional(),
  category: z.string().trim().min(1).max(40).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"] as const).optional(),
});

const listTribesSchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

const updateTribeSchema = z.object({
  coverImagePath: z.string().trim().min(1).max(1024).nullable(),
});

export { createTribeSchema, listTribesSchema, updateTribeSchema };
