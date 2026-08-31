import { LIMITS } from './constants';
import { z } from 'zod';

import { setTypeSchema, workoutStatusSchema } from './enums';
import {
  clientIdSchema,
  isoDateTimeSchema,
  objectIdSchema,
  paginationQuerySchema,
} from './primitives';

export const workoutSetSchema = z.object({
  id: clientIdSchema,
  order: z.number().int().min(0),
  type: setTypeSchema.default('working'),
  reps: z.number().int().min(LIMITS.reps.min).max(LIMITS.reps.max).optional(),
  weightKg: z
    .number()
    .min(LIMITS.weightKg.min)
    .max(LIMITS.weightKg.max)
    .optional(),
  durationSec: z
    .number()
    .int()
    .min(LIMITS.durationSec.min)
    .max(LIMITS.durationSec.max)
    .optional(),
  distanceM: z
    .number()
    .min(LIMITS.distanceM.min)
    .max(LIMITS.distanceM.max)
    .optional(),
  rpe: z.number().min(LIMITS.rpe.min).max(LIMITS.rpe.max).optional(),
  completed: z.boolean().default(false),
  notes: z.string().trim().max(LIMITS.notes.max).optional(),
});

export const workoutExerciseSchema = z.object({
  id: clientIdSchema,
  exerciseId: objectIdSchema,
  exerciseName: z.string().trim().min(1).max(LIMITS.exerciseName.max),
  order: z.number().int().min(0),
  sets: z.array(workoutSetSchema).max(LIMITS.setsPerExercise.max),
  restSeconds: z.number().int().min(0).max(3600).optional(),
  notes: z.string().trim().max(LIMITS.notes.max).optional(),
});

export const createWorkoutSchema = z.object({
  name: z.string().trim().min(LIMITS.name.min).max(LIMITS.name.max),
  startedAt: isoDateTimeSchema.optional(),
  exercises: z
    .array(workoutExerciseSchema)
    .max(LIMITS.exercisesPerWorkout.max)
    .default([]),
  notes: z.string().trim().max(LIMITS.notes.max).optional(),
  routineId: objectIdSchema.optional(),
});

export const updateWorkoutSchema = createWorkoutSchema
  .partial()
  .extend({
    status: workoutStatusSchema.optional(),
    completedAt: isoDateTimeSchema.optional(),
    durationSec: z.number().int().min(0).optional(),
  })
  .refine(
    (data) =>
      data.status !== 'completed' ||
      data.completedAt !== undefined ||
      data.durationSec !== undefined,
    {
      error: 'Completing a workout requires completedAt or durationSec',
      path: ['completedAt'],
    },
  );

/** Body for `POST /workouts/:id/complete`. */
export const completeWorkoutSchema = z.object({
  completedAt: isoDateTimeSchema.optional(),
  durationSec: z.number().int().min(0).optional(),
  notes: z.string().trim().max(LIMITS.notes.max).optional(),
});

/** Appends a single set to an in-progress workout — the offline-logging path. */
export const logSetSchema = z.object({
  workoutExerciseId: clientIdSchema,
  set: workoutSetSchema,
});

export const workoutQuerySchema = paginationQuerySchema
  .extend({
    status: workoutStatusSchema.optional(),
    from: isoDateTimeSchema.optional(),
    to: isoDateTimeSchema.optional(),
    exerciseId: objectIdSchema.optional(),
  })
  .refine(
    (data) => !data.from || !data.to || Date.parse(data.from) <= Date.parse(data.to),
    { error: '`from` must be before `to`', path: ['from'] },
  );

export type WorkoutSetInput = z.infer<typeof workoutSetSchema>;
export type WorkoutExerciseInput = z.infer<typeof workoutExerciseSchema>;
export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
export type CompleteWorkoutInput = z.infer<typeof completeWorkoutSchema>;
export type LogSetInput = z.infer<typeof logSetSchema>;
export type WorkoutQueryInput = z.infer<typeof workoutQuerySchema>;
