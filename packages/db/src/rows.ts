import type {
  AppSettings,
  BodyMeasurement,
  ChatConversation,
  ChatMessage,
  DailySteps,
  Exercise,
  Goal,
  Plan,
  Prisma,
  Routine,
  RoutineDay,
  RoutineDayExercise,
  User,
  Workout,
  DailyQuote,
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
export type DailyStepsRow = DailySteps;
export type GoalRow = Goal;
export type AppSettingsRow = AppSettings;
export type DailyQuoteRow = DailyQuote;
export type RoutineDayRow = RoutineDay;
export type RoutineDayExerciseRow = RoutineDayExercise;
export type ChatConversationRow = ChatConversation;
export type ChatMessageRow = ChatMessage;

/**
 * `days`/`exercises` are normalized into their own collections now (see the
 * schema comment on `WorkoutRoutine.days`), so assembling one full routine
 * needs this include everywhere it's read — single-sourced here rather than
 * repeated (and risking drifting order) at each call site.
 */
export const WORKOUT_ROUTINE_INCLUDE = {
  days: {
    orderBy: { order: 'asc' },
    include: { exercises: { orderBy: { order: 'asc' } } },
  },
} satisfies Prisma.WorkoutRoutineInclude;

export type WorkoutRoutineRow = Prisma.WorkoutRoutineGetPayload<{
  include: typeof WORKOUT_ROUTINE_INCLUDE;
}>;

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
