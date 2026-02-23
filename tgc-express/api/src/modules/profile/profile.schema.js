const { z } = require("zod");

const updateProfileSchema = z.object({
  intent: z.enum(["LEARN", "EARN", "ENTERTAIN"]).optional(),
  avatarUrl: z.string().url("Avatar URL must be a valid URL").max(512).nullable().optional(),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be at most 24 characters")
    .regex(/^[a-zA-Z0-9._]+$/, "Username can use letters, numbers, . and _")
    .optional(),
  fullName: z.string().trim().min(2).max(80).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(120, "Bio must be at most 120 characters").optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  activeMode: z.enum(["USER", "HOST"]).optional(),
});

module.exports = { updateProfileSchema };
