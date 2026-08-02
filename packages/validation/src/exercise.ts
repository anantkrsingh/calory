import { LIMITS } from '@fitness/config';
import { z } from 'zod';

import {
  equipmentSchema,
  exerciseCategorySchema,
  muscleGroupSchema,
} from './enums';
import { objectIdSchema, paginationQuerySchema } from './primitives';

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
  imageUrl: z.url().optional(),
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

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
export type ExerciseQueryInput = z.infer<typeof exerciseQuerySchema>;
