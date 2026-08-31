/**
 * App constants. Kept in sync by hand with
 * `packages/validation/src/constants.ts` and `apps/mobile/src/constants/app.ts`.
 */

/** Version segment appended after the API prefix, e.g. `/api/v1`. */
export const API_VERSION = 'v1';

export const AUTH = {
  /** Header carrying the bearer token. */
  headerName: 'authorization',
  scheme: 'Bearer',
} as const;

export const LIMITS = {
  chatTitle: { min: 1, max: 120 },
  /** How many prior messages to send to the model as context. */
  chatContextMessages: 40,
} as const;

/** Shown on the home widget until a per-user goal exists to override it. */
export const DEFAULT_DAILY_STEPS_GOAL = 10_000;
