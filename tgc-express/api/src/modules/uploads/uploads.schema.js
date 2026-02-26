const { z } = require("zod");
const { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_BYTES } = require("./upload.service");

const presignUploadSchema = z
  .object({
    purpose: z.enum(["profile", "tribe-cover", "tribe-post", "event-cover"]),
    fileName: z.string().trim().min(1, "fileName is required").max(255),
    mimeType: z
      .string()
      .trim()
      .refine((value) => ALLOWED_IMAGE_MIME_TYPES.has(value), {
        message: `mimeType must be one of: ${Array.from(ALLOWED_IMAGE_MIME_TYPES).join(", ")}`,
      }),
    tribeId: z.string().trim().min(1).optional(),
    fileSize: z.coerce.number().int().positive().max(MAX_UPLOAD_BYTES).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.purpose.startsWith("tribe-") && !data.tribeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tribeId"],
        message: "tribeId is required for tribe uploads",
      });
    }
  });

const viewUrlQuerySchema = z.object({
  path: z.string().trim().min(1, "path is required").max(1024),
});

module.exports = { presignUploadSchema, viewUrlQuerySchema };
