import { LIMITS } from './constants';
import { z } from 'zod';

import { goalStatusSchema, goalTypeSchema } from './enums';
import {
  isoDateSchema,
  objectIdSchema,
  paginationQuerySchema,
} from './primitives';

export const createGoalSchema = z
  .object({
    type: goalTypeSchema,
    title: z.string().trim().min(LIMITS.name.min).max(LIMITS.name.max),
    targetValue: z.number(),
    startValue: z.number(),
    unit: z.string().trim().min(1).max(24),
    deadline: isoDateSchema.optional(),
    exerciseId: objectIdSchema.optional(),
  })
  .refine(
    (data) => data.type !== 'exercise_one_rep_max' || data.exerciseId !== undefined,
    {
      error: 'A one-rep-max goal must reference an exercise',
      path: ['exerciseId'],
    },
  )
  .refine((data) => data.targetValue !== data.startValue, {
    error: 'Target must differ from the starting value',
    path: ['targetValue'],
  });

export const updateGoalSchema = z.object({
  title: z.string().trim().min(LIMITS.name.min).max(LIMITS.name.max).optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().trim().min(1).max(24).optional(),
  deadline: isoDateSchema.optional(),
  status: goalStatusSchema.optional(),
});

export const goalQuerySchema = paginationQuerySchema.extend({
  status: goalStatusSchema.optional(),
  type: goalTypeSchema.optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type GoalQueryInput = z.infer<typeof goalQuerySchema>;
