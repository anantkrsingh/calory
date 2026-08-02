/**
 * Isomorphic constants — safe to import from the API and the Expo app.
 * Nothing here may touch `process.env` or Node built-ins.
 */

export const APP_NAME = 'Fitness Tracker';

/** Default REST prefix the API mounts under. */
export const API_PREFIX = 'api';

/** Version segment appended after the prefix, e.g. `/api/v1`. */
export const API_VERSION = 'v1';

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
} as const;

export const AUTH = {
  /** Header carrying the bearer token. */
  headerName: 'authorization',
  scheme: 'Bearer',
  minPasswordLength: 8,
  maxPasswordLength: 128,
} as const;

/** Domain limits shared by validation schemas and UI form hints. */
export const LIMITS = {
  name: { min: 1, max: 120 },
  notes: { max: 2000 },
  exerciseName: { min: 1, max: 120 },
  setsPerExercise: { max: 50 },
  exercisesPerWorkout: { max: 50 },
  reps: { min: 0, max: 1000 },
  weightKg: { min: 0, max: 1000 },
  distanceM: { min: 0, max: 1_000_000 },
  durationSec: { min: 0, max: 86_400 },
  rpe: { min: 1, max: 10 },
  heightCm: { min: 50, max: 300 },
  bodyWeightKg: { min: 20, max: 500 },
  bodyFatPercentage: { min: 1, max: 75 },
} as const;

export const UNIT_CONVERSION = {
  kgPerLb: 0.45359237,
  cmPerInch: 2.54,
  metersPerMile: 1609.344,
} as const;

export const QUERY_KEYS = {
  me: ['me'] as const,
  exercises: ['exercises'] as const,
  workouts: ['workouts'] as const,
  routines: ['routines'] as const,
  measurements: ['measurements'] as const,
  goals: ['goals'] as const,
} as const;
