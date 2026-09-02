import { z } from 'zod';

import { objectIdSchema } from './primitives';

/**
 * Marks one meal item taken/untaken for the day, or — when `itemId` is
 * omitted — every item in the meal at once, so the app's "mark it taken"
 * button can work per item or for the whole meal with the same endpoint.
 */
export const markDietItemsTakenSchema = z.object({
  mealId: objectIdSchema,
  itemId: objectIdSchema.optional(),
  taken: z.boolean(),
});

export type MarkDietItemsTakenInput = z.infer<typeof markDietItemsTakenSchema>;
