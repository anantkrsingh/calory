import { z } from 'zod';

import { isoDateSchema } from './primitives';

export const workoutRoutineCaloriesRangeQuerySchema = z.object({
  from: isoDateSchema,
  to: isoDateSchema,
});

export type WorkoutRoutineCaloriesRangeQueryInput = z.infer<
  typeof workoutRoutineCaloriesRangeQuerySchema
>;
