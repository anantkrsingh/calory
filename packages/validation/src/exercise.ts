import { LIMITS } from './constants';
import { z } from 'zod';

import {
  equipmentSchema,
  exerciseCategorySchema,
  exerciseLogFieldRequirementSchema,
  muscleGroupSchema,
} from './enums';
import { clientIdSchema, objectIdSchema, paginationQuerySchema } from './primitives';

/** One step of an exercise's illustrated how-to — distinct from `instructions`
 * (a single free-text description). `image` may be a fresh upload or a URL
 * reused from the exercise's own `images` gallery, so it's just a plain URL. */
export const exerciseInstructionStepSchema = z.object({
  id: clientIdSchema,
  order: z.number().int().nonnegative(),
  text: z
    .string()
    .trim()
    .min(LIMITS.exerciseInstructionStepText.min)
    .max(LIMITS.exerciseInstructionStepText.max),
  image: z.url().nullish(),
});

/** Nothing applies until an admin says otherwise. */
const ALL_HIDDEN_LOG_FIELDS = {
  reps: 'hidden',
  weightKg: 'hidden',
  sets: 'hidden',
  durationSec: 'hidden',
  distanceM: 'hidden',
} as const;

/** Which WorkoutSet fields to ask for when logging this exercise, and
 * whether each is mandatory — admin-set per exercise, defaulting to
 * "hidden" (not applicable) for anything left unspecified. */
export const exerciseLogFieldsSchema = z.object({
  reps: exerciseLogFieldRequirementSchema.default('hidden'),
  weightKg: exerciseLogFieldRequirementSchema.default('hidden'),
  sets: exerciseLogFieldRequirementSchema.default('hidden'),
  durationSec: exerciseLogFieldRequirementSchema.default('hidden'),
  distanceM: exerciseLogFieldRequirementSchema.default('hidden'),
});

export const createExerciseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(LIMITS.exerciseName.min)
    .max(LIMITS.exerciseName.max),
  category: exerciseCategorySchema,
  primaryMuscles: z
    .array(muscleGroupSchema)
    .min(1, 'Pick at least one primary muscle'),
  secondaryMuscles: z.array(muscleGroupSchema).default([]),
  equipment: equipmentSchema,
  instructions: z.string().trim().max(LIMITS.notes.max).optional(),
  instructionSteps: z
    .array(exerciseInstructionStepSchema)
    .max(LIMITS.exerciseInstructionSteps.max)
    .default([]),
  thumbnail: z.url().nullish(),
  images: z.array(z.url()).max(LIMITS.exerciseImages.max).default([]),
  logFields: exerciseLogFieldsSchema.default(ALL_HIDDEN_LOG_FIELDS),
});

// `.partial()` only makes `logFields` itself optional, not its inner keys —
// a caller omitting a key there would otherwise re-default it to "hidden"
// via `exerciseLogFieldsSchema`'s own defaults, clobbering whatever an admin
// set previously. Override it with a true partial so the service can merge
// only the keys actually sent onto the exercise's current `logFields`, the
// same convention `UsersService.update` uses for `profile`/`preferences`.
export const updateExerciseSchema = createExerciseSchema.partial().extend({
  logFields: exerciseLogFieldsSchema.partial().optional(),
});

export const exerciseQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(120).optional(),
  category: exerciseCategorySchema.optional(),
  muscleGroup: muscleGroupSchema.optional(),
  equipment: equipmentSchema.optional(),
  customOnly: z.coerce.boolean().default(false),
});

export const exerciseIdParamSchema = z.object({
  id: objectIdSchema,
});

/** Powers the Build screen's muscle-wise browse — search matches either an
 * exercise name or a muscle group (e.g. "chest", "full body"). */
export const exerciseByMuscleQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
});

export type ExerciseInstructionStepInput = z.infer<
  typeof exerciseInstructionStepSchema
>;
export type ExerciseLogFieldsInput = z.infer<typeof exerciseLogFieldsSchema>;
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
export type ExerciseQueryInput = z.infer<typeof exerciseQuerySchema>;
export type ExerciseByMuscleQueryInput = z.infer<typeof exerciseByMuscleQuerySchema>;
