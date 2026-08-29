import { LIMITS } from '@fitness/config';
import { z } from 'zod';

import {
  equipmentSchema,
  exerciseCategorySchema,
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
});

export const updateExerciseSchema = createExerciseSchema.partial();

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
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
export type ExerciseQueryInput = z.infer<typeof exerciseQuerySchema>;
export type ExerciseByMuscleQueryInput = z.infer<typeof exerciseByMuscleQuerySchema>;
