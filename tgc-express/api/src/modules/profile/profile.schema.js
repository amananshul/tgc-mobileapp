const { z } = require("zod");

const GROWTH_INTENT_VALUES = [
  "LEARN",
  "EARN",
  "ENTERTAIN",
  "VOLUNTEER",
  "NETWORK",
];

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-z0-9._]+$/, "Username can use lowercase letters, numbers, . and _");

const updateProfileSchema = z.object({
  intent: z.enum(["LEARN", "EARN", "ENTERTAIN"]).optional(),
  growthIntent: z
    .array(z.enum(GROWTH_INTENT_VALUES))
    .min(1)
    .max(5)
    .optional(),
  avatarPath: z.string().trim().min(1).max(1024).nullable().optional(),
  username: usernameSchema.optional(),
  fullName: z.string().trim().min(2).max(80).optional(),
  city: z.string().trim().min(2).max(40).optional(),
  bio: z.string().trim().max(140, "Bio must be at most 140 characters").optional(),
  shortBio: z.string().trim().max(140, "Short bio must be at most 140 characters").optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  activeMode: z.enum(["USER", "HOST"]).optional(),
});

const updateOnboardingSchema = z.object({
  growthIntent: z
    .array(z.enum(GROWTH_INTENT_VALUES))
    .min(1, "Pick at least one growth intent")
    .max(5, "Pick up to 5 growth intents"),
  avatarPath: z.string().trim().min(1).max(1024),
  username: usernameSchema,
  fullName: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(40),
  shortBio: z.string().trim().min(1).max(140),
  interests: z.array(z.string().trim().min(1).max(40)).min(1).max(5),
  skills: z.array(z.string().trim().min(1).max(40)).min(1).max(5),
});

module.exports = {
  updateProfileSchema,
  updateOnboardingSchema,
  GROWTH_INTENT_VALUES,
};
