import { z } from 'zod';

import { objectIdSchema } from './primitives';

export const portionFoodSchema = z.object({
  id: objectIdSchema,
  name: z.string(),
  unit: z.string(),
  gramsPerUnit: z.number().int().optional(),
  calories: z.number().int(),
  proteinG: z.number().int(),
  fatG: z.number().int(),
  carbsG: z.number().int(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

export const loggedPortionSchema = z.object({
  id: z.string(),
  portionId: objectIdSchema.optional(),
  name: z.string(),
  unit: z.string(),
  quantity: z.number(),
  calories: z.number().int(),
  proteinG: z.number().int(),
  fatG: z.number().int(),
  carbsG: z.number().int(),
  loggedAt: z.string(),
});

/** Logging an off-plan food. Macros come from the catalogue server-side — the
 * client sends only what was eaten and how much, so a tampered body cannot
 * invent nutrition figures. */
export const logPortionSchema = z.object({
  portionId: objectIdSchema,
  /** Half portions are common ("half a katori"), so this is not an integer. */
  quantity: z.number().min(0.25).max(20),
});

export const removePortionSchema = z.object({
  entryId: z.string().min(1).max(64),
});

/** Admin catalogue management. */
export const createPortionFoodSchema = z.object({
  name: z.string().trim().min(1).max(80),
  unit: z.string().trim().min(1).max(24),
  gramsPerUnit: z.coerce.number().int().min(1).max(2000).optional(),
  calories: z.coerce.number().int().min(0).max(2000),
  proteinG: z.coerce.number().int().min(0).max(300),
  fatG: z.coerce.number().int().min(0).max(300),
  carbsG: z.coerce.number().int().min(0).max(500),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

export const updatePortionFoodSchema = createPortionFoodSchema.partial();

export type LogPortionInput = z.infer<typeof logPortionSchema>;
export type RemovePortionInput = z.infer<typeof removePortionSchema>;
export type CreatePortionFoodInput = z.infer<typeof createPortionFoodSchema>;
export type UpdatePortionFoodInput = z.infer<typeof updatePortionFoodSchema>;
