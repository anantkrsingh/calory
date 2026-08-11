import type {
  AppSettings,
  BodyMeasurement,
  Exercise,
  Goal,
  Plan,
  Routine,
  User,
  Workout,
} from '@prisma/client';

/**
 * Prisma's generated model types collide by name with the wire contracts in
 * `@fitness/types` (`User` means two different things). Re-exporting them with a
 * `Row` suffix keeps both importable in the same file without aliasing at every
 * call site, and makes "this is a database shape" explicit.
 */
export type UserRow = User;
export type PlanRow = Plan;
export type ExerciseRow = Exercise;
export type WorkoutRow = Workout;
export type RoutineRow = Routine;
export type BodyMeasurementRow = BodyMeasurement;
export type GoalRow = Goal;
export type AppSettingsRow = AppSettings;

export type {
  AiPromptConfig as AiPromptConfigComposite,
  BodyMeasurements as BodyMeasurementsComposite,
  RoutineExercise as RoutineExerciseComposite,
  RoutineSet as RoutineSetComposite,
  UserPreferences as UserPreferencesComposite,
  UserProfile as UserProfileComposite,
  WorkoutExercise as WorkoutExerciseComposite,
  WorkoutSet as WorkoutSetComposite,
  WorkoutStats as WorkoutStatsComposite,
} from '@prisma/client';
