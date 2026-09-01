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

/** Signed params a client uses to upload an image straight to Cloudinary. */
export const uploadSignatureSchema = z.object({
  cloudName: z.string().min(1),
  apiKey: z.string().min(1),
  timestamp: z.number().int().positive(),
  signature: z.string().min(1),
  folder: z.string().min(1),
});

export type UploadSignature = z.infer<typeof uploadSignatureSchema>;

export const uploadSignatureRequestSchema = z.object({
  folder: z.string().min(1).optional(),
});

export type UploadSignatureRequest = z.infer<typeof uploadSignatureRequestSchema>;
