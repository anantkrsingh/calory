import type { Entity, Id, IsoDate, IsoDateTime } from './common';

export const QUOTE_QUEUE_NAME = 'quote';
export const ROUTINE_QUEUE_NAME = 'routine';
/** Backfills a daily plan for any registered user who doesn't have one yet. */
export const ROUTINE_RECONCILE_QUEUE_NAME = 'routine-reconcile';

export const WorkoutRoutineStatus = {
  Generating: 'generating',
  Active: 'active',
  Failed: 'failed',
  Superseded: 'superseded',
} as const;
export type WorkoutRoutineStatus =
  (typeof WorkoutRoutineStatus)[keyof typeof WorkoutRoutineStatus];

export interface QuoteJobData {
  /** ISO calendar date the quote belongs to. */
  date: IsoDate;
}

export interface QuoteJobResult {
  date: IsoDate;
  quoteOfTheDay: string;
}

export interface RoutineJobData {
  userId: Id;
  routineId: Id;
}

export interface RoutineJobResult {
  routineId: Id;
  status: WorkoutRoutineStatus;
}

export interface RoutineReconcileJobResult {
  /** Users a generation job was queued for on this pass. */
  queued: number;
}

export interface DailyQuote extends Entity {
  date: IsoDate;
  quoteOfTheDay: string;
}

export interface RoutinePlanExercise {
  exerciseId: Id;
  exerciseName: string;
  sets: number;
  reps?: number;
  durationSec?: number;
  restSeconds?: number;
  /** AI-estimated total kcal burned completing every prescribed set — the
   * basis for a live calories-burned figure as sets get logged. */
  estimatedCalories: number;
}

/** 1 = Monday .. 7 = Sunday. */
export interface RoutinePlanDay {
  dayOfWeek: number;
  isRestDay: boolean;
  /** caloriesFromRunning + caloriesFromExercises. */
  targetCaloriesBurned: number;
  /** Portion of targetCaloriesBurned from running/walking/steps. */
  caloriesFromRunning: number;
  /** Portion of targetCaloriesBurned from the exercises below. */
  caloriesFromExercises: number;
  /** Steps target for this day — present every day, rest days included. */
  stepsTarget: number;
  runningDistanceKm?: number;
  runningDurationMin?: number;
  focus: string;
  exercises: RoutinePlanExercise[];
}

export interface WorkoutRoutine extends Entity {
  userId: Id;
  status: WorkoutRoutineStatus;
  /** Daily calorie intake target. */
  dailyCalorieTarget?: number;
  /** AI-estimated kcal burned per step, from the user's weight/BMI — a live
   * step count times this gives a live calories-burned-from-steps figure.
   * Steps/calorie-burn targets otherwise live per day in `days`. */
  caloriesPerStep?: number;
  summary?: string;
  days: RoutinePlanDay[];
  error?: string;
  generatedAt?: IsoDateTime;
}

/** How much of today's calorie-burn target has actually been earned, from
 * logged steps and completed sets against today's plan. */
export interface TodayRoutineCalories {
  fromSteps: number;
  fromExercises: number;
  total: number;
}

/** Home-screen summary: today's slice of the active routine, layered with the
 * user's real step count and completed sets so far today. */
export interface TodayRoutine {
  /** `null` when the user has no routine at all yet (still generating on first request). */
  routineStatus: WorkoutRoutineStatus | null;
  date: IsoDate;
  /** Daily calorie *intake* target, carried from the routine. */
  dailyCalorieTarget?: number;
  /** Undefined when there's no active routine, or the routine has no plan for this weekday. */
  day?: RoutinePlanDay;
  stepsToday: number;
  caloriesBurned: TodayRoutineCalories;
}
