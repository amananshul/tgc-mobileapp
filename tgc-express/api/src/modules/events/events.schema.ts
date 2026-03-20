import { z } from "zod";

const EVENT_CATEGORIES = [
  "WORKSHOP",
  "OPEN_MIC",
  "FITNESS",
  "MUSIC",
  "ART",
  "TECH",
  "SOCIAL",
  "VOLUNTEER",
  "OTHER",
] as const;

const EVENT_VISIBILITIES = ["PUBLIC", "TRIBE_ONLY", "PRIVATE"] as const;

const createEventSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().trim().max(2000).optional(),
  category: z.enum(EVENT_CATEGORIES).optional().default("OTHER"),
  city: z.string().trim().min(1, "City is required").max(100),
  venueName: z.string().trim().max(120).optional(),
  addressText: z.string().trim().max(255).optional(),
  startAt: z
    .string()
    .datetime({ offset: true, message: "startAt must be a valid ISO datetime" }),
  endAt: z
    .string()
    .datetime({ offset: true, message: "endAt must be a valid ISO datetime" })
    .optional(),
  coverImageUrl: z.string().trim().min(1).max(1024).optional(),
  visibility: z.enum(EVENT_VISIBILITIES).optional().default("PUBLIC"),
  tribeId: z.string().uuid().optional(),
  capacity: z.coerce.number().int().min(1).optional(),
});

const updateEventSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  category: z.enum(EVENT_CATEGORIES).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  venueName: z.string().trim().max(120).optional().nullable(),
  addressText: z.string().trim().max(255).optional().nullable(),
  startAt: z.string().datetime({ offset: true }).optional(),
  endAt: z.string().datetime({ offset: true }).optional().nullable(),
  coverImageUrl: z.string().trim().min(1).max(1024).optional().nullable(),
  visibility: z.enum(EVENT_VISIBILITIES).optional(),
  tribeId: z.string().uuid().optional().nullable(),
  capacity: z.coerce.number().int().min(1).optional().nullable(),
});

const listEventsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.enum(EVENT_CATEGORIES).optional(),
  city: z.string().trim().max(100).optional(),
  tribeId: z.string().uuid().optional(),
  dateFilter: z.enum(["today", "weekend", "week", "all"] as const).optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export { createEventSchema, updateEventSchema, listEventsQuerySchema };
