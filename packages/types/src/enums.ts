/**
 * Enumerations are `as const` objects rather than TS `enum`s so they survive
 * `isolatedModules`, tree-shake cleanly, and serialise as plain strings.
 */

export const UnitSystem = {
  Metric: 'metric',
  Imperial: 'imperial',
} as const;
export type UnitSystem = (typeof UnitSystem)[keyof typeof UnitSystem];

export const Sex = {
  Male: 'male',
  Female: 'female',
  Other: 'other',
  PreferNotToSay: 'prefer_not_to_say',
} as const;
export type Sex = (typeof Sex)[keyof typeof Sex];

export const ActivityLevel = {
  Sedentary: 'sedentary',
  Light: 'light',
  Moderate: 'moderate',
  Active: 'active',
  VeryActive: 'very_active',
} as const;
export type ActivityLevel = (typeof ActivityLevel)[keyof typeof ActivityLevel];

export const UserRole = {
  User: 'user',
  Admin: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const MuscleGroup = {
  Chest: 'chest',
  Back: 'back',
  Shoulders: 'shoulders',
  Biceps: 'biceps',
  Triceps: 'triceps',
  Forearms: 'forearms',
  Quads: 'quads',
  Hamstrings: 'hamstrings',
  Glutes: 'glutes',
  Calves: 'calves',
  Core: 'core',
  FullBody: 'full_body',
  Cardio: 'cardio',
} as const;
export type MuscleGroup = (typeof MuscleGroup)[keyof typeof MuscleGroup];

export const Equipment = {
  Barbell: 'barbell',
  Dumbbell: 'dumbbell',
  Kettlebell: 'kettlebell',
  Machine: 'machine',
  Cable: 'cable',
  Bodyweight: 'bodyweight',
  Band: 'band',
  Other: 'other',
} as const;
export type Equipment = (typeof Equipment)[keyof typeof Equipment];

/** Determines which set fields are meaningful for an exercise. */
export const ExerciseCategory = {
  /** reps + weight */
  Strength: 'strength',
  /** duration + distance */
  Cardio: 'cardio',
  /** duration only */
  Duration: 'duration',
  /** reps only */
  Reps: 'reps',
} as const;
export type ExerciseCategory =
  (typeof ExerciseCategory)[keyof typeof ExerciseCategory];

export const SetType = {
  Working: 'working',
  Warmup: 'warmup',
  Drop: 'drop',
  Failure: 'failure',
} as const;
export type SetType = (typeof SetType)[keyof typeof SetType];

export const WorkoutStatus = {
  InProgress: 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const;
export type WorkoutStatus = (typeof WorkoutStatus)[keyof typeof WorkoutStatus];

export const GoalType = {
  BodyWeight: 'body_weight',
  BodyFat: 'body_fat',
  WorkoutsPerWeek: 'workouts_per_week',
  ExerciseOneRepMax: 'exercise_one_rep_max',
  TotalVolume: 'total_volume',
  DistanceRun: 'distance_run',
} as const;
export type GoalType = (typeof GoalType)[keyof typeof GoalType];

export const GoalStatus = {
  Active: 'active',
  Achieved: 'achieved',
  Abandoned: 'abandoned',
} as const;
export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];

export const MEASUREMENT_SITES = [
  'neck',
  'chest',
  'waist',
  'hips',
  'leftArm',
  'rightArm',
  'leftThigh',
  'rightThigh',
  'leftCalf',
  'rightCalf',
] as const;
export type MeasurementSite = (typeof MEASUREMENT_SITES)[number];
