import { DietType } from '@fitness/types';
import { z } from 'zod';

import { LIMITS } from './constants';
import { dietCuisineSchema, dietTypeSchema } from './enums';
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

/**
 * Inputs for (re)generating a diet plan — same body whether it comes from the
 * "Create my diet plan" button or the chat agent's tool call. Everything is
 * optional: `DietPlansService.requestGeneration` fills in a default for
 * anything omitted (including `cuisine`, resolved from the caller's IP).
 */
export const generateDietPlanSchema = z.object({
  /** Can combine `veg`/`non_veg` (e.g. "mostly veg, some non-veg"), but
   * `vegan` never mixes with either — it's a stricter, standalone diet. */
  dietTypes: z
    .array(dietTypeSchema)
    .min(1, 'Pick at least one diet type')
    .max(Object.keys(DietType).length)
    .default([DietType.NonVeg])
    .refine((types) => !(types.includes(DietType.Vegan) && types.length > 1), {
      message: 'Vegan cannot be combined with other diet types',
    }),
  /** Omit to default from the caller's IP-detected country. */
  cuisine: dietCuisineSchema.optional(),
  /** Foods/ingredients to leave out of every meal, e.g. "peanuts", "shellfish". */
  exclude: z
    .array(
      z
        .string()
        .trim()
        .min(LIMITS.dietExcludedFood.min)
        .max(LIMITS.dietExcludedFood.max),
    )
    .max(LIMITS.dietExclusions.max)
    .default([]),
  mealsPerDay: z
    .number()
    .int()
    .min(LIMITS.dietMealsPerDay.min)
    .max(LIMITS.dietMealsPerDay.max)
    .default(LIMITS.dietMealsPerDay.default),
});

export type GenerateDietPlanInput = z.infer<typeof generateDietPlanSchema>;
