import { LIMITS } from '@fitness/config';
import { z } from 'zod';

import { setTypeSchema } from './enums';
import {
  clientIdSchema,
  objectIdSchema,
  paginationQuerySchema,
} from './primitives';

export const routineSetSchema = z.object({
  id: clientIdSchema,
  order: z.number().int().min(0),
  type: setTypeSchema.default('working'),
  targetReps: z
    .number()
    .int()
    .min(LIMITS.reps.min)
    .max(LIMITS.reps.max)
    .optional(),
  targetWeightKg: z
    .number()
    .min(LIMITS.weightKg.min)
    .max(LIMITS.weightKg.max)
    .optional(),
  targetDurationSec: z
    .number()
    .int()
    .min(LIMITS.durationSec.min)
    .max(LIMITS.durationSec.max)
    .optional(),
  targetDistanceM: z
    .number()
    .min(LIMITS.distanceM.min)
    .max(LIMITS.distanceM.max)
    .optional(),
});

export const routineExerciseSchema = z.object({
  id: clientIdSchema,
  exerciseId: objectIdSchema,
  exerciseName: z.string().trim().min(1).max(LIMITS.exerciseName.max),
  order: z.number().int().min(0),
  sets: z.array(routineSetSchema).max(LIMITS.setsPerExercise.max),
  restSeconds: z.number().int().min(0).max(3600).optional(),
  notes: z.string().trim().max(LIMITS.notes.max).optional(),
});

export const createRoutineSchema = z.object({
  name: z.string().trim().min(LIMITS.name.min).max(LIMITS.name.max),
  description: z.string().trim().max(LIMITS.notes.max).optional(),
  exercises: z
    .array(routineExerciseSchema)
    .min(1, 'A routine needs at least one exercise')
    .max(LIMITS.exercisesPerWorkout.max),
  estimatedDurationSec: z.number().int().min(0).max(86_400).optional(),
});

export const updateRoutineSchema = createRoutineSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

export const routineQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(120).optional(),
  includeArchived: z.coerce.boolean().default(false),
});

/** Body for `POST /routines/:id/start` — spins a routine into a live workout. */
export const startRoutineSchema = z.object({
  name: z.string().trim().min(LIMITS.name.min).max(LIMITS.name.max).optional(),
});

export type RoutineSetInput = z.infer<typeof routineSetSchema>;
export type RoutineExerciseInput = z.infer<typeof routineExerciseSchema>;
export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
export type RoutineQueryInput = z.infer<typeof routineQuerySchema>;
export type StartRoutineInput = z.infer<typeof startRoutineSchema>;
