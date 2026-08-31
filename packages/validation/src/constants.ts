/**
 * Domain constants backing these schemas. Kept in sync by hand with the
 * matching values in `apps/api/src/config/constants.ts` and
 * `apps/mobile/src/constants/app.ts`.
 */

export const AUTH = {
  minPasswordLength: 8,
  maxPasswordLength: 128,
} as const;

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
} as const;

/** Domain limits shared by validation schemas and UI form hints. */
export const LIMITS = {
  name: { min: 1, max: 120 },
  notes: { max: 2000 },
  exerciseName: { min: 1, max: 120 },
  exerciseImages: { max: 10 },
  exerciseInstructionSteps: { max: 20 },
  exerciseInstructionStepText: { min: 1, max: 500 },
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
  chatTitle: { min: 1, max: 120 },
  chatMessage: { min: 1, max: 4000 },
  /** How many prior messages to send to the model as context. */
  chatContextMessages: 40,
  /** Generous ceiling — a marathon is ~50-60k steps. */
  steps: { min: 0, max: 200_000 },
} as const;
