import { z } from 'zod';
import { objectIdSchema } from './primitives';

export const planSchema = z.object({
  id: objectIdSchema,
  name: z.string().trim().min(1, 'Plan name is required'),
  description: z.string().trim().optional(),
  duration: z.string().trim().min(1, 'Duration is required'),
  durationDays: z.number().int().positive().optional(),
  price: z.number().min(0, 'Price must be non-negative').default(0),
  currency: z.string().trim().min(1).default('USD'),
  benefits: z.array(z.string().trim().min(1)).default([]),
  storeProductId: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createPlanSchema = z.object({
  name: z.string().trim().min(1, 'Plan name is required'),
  description: z.string().trim().optional(),
  duration: z.string().trim().min(1, 'Duration is required'),
  durationDays: z.number().int().positive().optional(),
  price: z.number().min(0, 'Price must be non-negative').default(0),
  currency: z.string().trim().min(1).default('USD'),
  benefits: z.array(z.string().trim().min(1)).default([]),
  storeProductId: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export const updatePlanSchema = createPlanSchema.partial();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
