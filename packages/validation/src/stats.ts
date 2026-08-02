import { z } from 'zod';

import { isoDateSchema } from './primitives';

export const statsRangeSchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
  })
  .refine((data) => Date.parse(data.from) <= Date.parse(data.to), {
    error: '`from` must be on or before `to`',
    path: ['from'],
  });

export const dashboardQuerySchema = z.object({
  /** How many days of daily activity to include in the response. */
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export type StatsRangeInput = z.infer<typeof statsRangeSchema>;
export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
