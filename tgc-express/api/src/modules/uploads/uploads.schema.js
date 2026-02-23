const { z } = require('zod');

const uploadAvatarSchema = z
  .object({
    sourceUrl: z.string().url('sourceUrl must be a valid URL').optional(),
    imageData: z
      .string()
      .regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, 'imageData must be a valid image data URI')
      .optional(),
  })
  .refine(data => Boolean(data.sourceUrl || data.imageData), {
    message: 'Provide sourceUrl or imageData',
    path: ['sourceUrl'],
  });

module.exports = { uploadAvatarSchema };
