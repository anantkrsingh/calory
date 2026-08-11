import { z } from 'zod';

export const uploadedImageSchema = z.object({
  url: z.url(),
  publicId: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().optional(),
  bytes: z.number().int().nonnegative().optional(),
});

export type UploadedImage = z.infer<typeof uploadedImageSchema>;
