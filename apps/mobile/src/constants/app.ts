/**
 * App-wide constants that mirror the values the API validates against.
 * Kept in sync by hand with `apps/api/src/config/constants.ts` and
 * `packages/validation/src/constants.ts`.
 */

/** Default REST prefix the API mounts under. */
export const API_PREFIX = 'api';

/** Version segment appended after the prefix, e.g. `/api/v1`. */
export const API_VERSION = 'v1';

export const AUTH = {
  /** Header carrying the bearer token. */
  headerName: 'authorization',
  scheme: 'Bearer',
  minPasswordLength: 8,
  maxPasswordLength: 128,
} as const;

/** Domain limits shared with the API's validation schemas. */
export const LIMITS = {
  name: { min: 1, max: 120 },
  heightCm: { min: 50, max: 300 },
  bodyWeightKg: { min: 20, max: 500 },
} as const;

export const UNIT_CONVERSION = {
  kgPerLb: 0.45359237,
  cmPerInch: 2.54,
} as const;

/** Shown on the home widget until a per-user goal exists to override it. */
export const DEFAULT_DAILY_STEPS_GOAL = 10_000;
