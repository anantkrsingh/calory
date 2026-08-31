import { LIMITS } from './constants';
import { z } from 'zod';

import { isoDateSchema } from './primitives';

/** Upserted by (user, date from the path) — safe to call repeatedly as the day's count climbs. */
export const upsertStepsSchema = z.object({
  steps: z.number().int().min(LIMITS.steps.min).max(LIMITS.steps.max),
});

export const stepsRangeQuerySchema = z.object({
  from: isoDateSchema,
  to: isoDateSchema,
});

export type UpsertStepsInput = z.infer<typeof upsertStepsSchema>;
export type StepsRangeQueryInput = z.infer<typeof stepsRangeQuerySchema>;
