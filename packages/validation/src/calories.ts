import { z } from 'zod';

import {
  activityLevelSchema,
  exerciseCategorySchema,
  fitnessGoalSchema,
} from './enums';
import { isoDateSchema } from './primitives';

export const calorieRangeQuerySchema = z.object({
  from: isoDateSchema,
  to: isoDateSchema,
});

/** Mirrors `AdaptiveTdee` in @fitness/types. */
export const adaptiveTdeeSchema = z.object({
  formulaTdee: z.number().int().nullable(),
  observedTdee: z.number().int().nullable(),
  tdee: z.number().int().nullable(),
  trendKgPerDay: z.number().nullable(),
  daysOfData: z.number().int(),
  isAdaptive: z.boolean(),
  clampedTo: z.enum(['floor', 'ceiling']).optional(),
});

/** Mirrors `CalorieBalance` in @fitness/types. Nullable fields read as null
 * until the profile carries enough to compute a BMR. */
export const calorieBalanceSchema = z.object({
  date: isoDateSchema,
  bmr: z.number().int().nullable(),
  tdee: z.number().int().nullable(),
  targetCalories: z.number().int().nullable(),
  consumedCalories: z.number().int(),
  consumedProteinG: z.number().int(),
  consumedFatG: z.number().int(),
  consumedCarbsG: z.number().int(),
  burnedFromExercise: z.number().int(),
  burnedFromSteps: z.number().int(),
  burnedTotal: z.number().int(),
  netCalories: z.number().int().nullable(),
  remainingCalories: z.number().int().nullable(),
  adaptive: adaptiveTdeeSchema.optional(),
});

/** MET must stay in a physiologically sensible band — 1 is resting, and
 * anything past ~20 outruns elite sprinting. */
const metValueSchema = z.number().min(1).max(20);
const multiplierValueSchema = z.number().min(1).max(3);
/** A fraction of TDEE: -0.5 halves intake, +0.5 adds half again. Wider than
 * anyone should need, but the safe-minimum floor still applies downstream. */
const adjustmentValueSchema = z.number().min(-0.5).max(0.5);

/**
 * Keyed by enum to match `CalorieConfig` in @fitness/types — the engine reads
 * these as a map. Every key is optional: an absent key means "use the
 * researched default", which is not the same as zero.
 */
export const calorieConfigSchema = z.object({
  categoryMets: z.partialRecord(exerciseCategorySchema, metValueSchema).optional(),
  activityMultipliers: z
    .partialRecord(activityLevelSchema, multiplierValueSchema)
    .optional(),
  goalAdjustments: z
    .partialRecord(fitnessGoalSchema, adjustmentValueSchema)
    .optional(),
  kcalPerStepPerKg: z.number().min(0).max(0.01).optional(),
  secondsPerSet: z.number().int().min(5).max(600).optional(),
  defaultRestSeconds: z.number().int().min(0).max(600).optional(),
  restMetFraction: z.number().min(0).max(1).optional(),
  minIntakeMale: z.number().int().min(800).max(4000).optional(),
  minIntakeFemale: z.number().int().min(800).max(4000).optional(),
});

export type CalorieRangeQueryInput = z.infer<typeof calorieRangeQuerySchema>;
export type CalorieConfigInput = z.infer<typeof calorieConfigSchema>;
