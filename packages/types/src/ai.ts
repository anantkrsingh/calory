import type { DayOfWeek } from './enums';
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

/** Generated once and kept for the routine's lifetime — a training day stays
 * `active` every week; mark it `rest` for a planned recovery/off day. */
export const RoutineDayStatus = {
  Active: 'active',
  Rest: 'rest',
} as const;
export type RoutineDayStatus =
  (typeof RoutineDayStatus)[keyof typeof RoutineDayStatus];

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
  /** Of `queued`, users who never had a routine generated at all. */
  neverGenerated: number;
  /** Of `queued`, users whose prior attempt(s) had `status: 'failed'`. */
  retriedAfterFailure: number;
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

export interface RoutinePlanDay {
  dayOfWeek: DayOfWeek;
  status: RoutineDayStatus;
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
  dailyCalorieTarget?: number;
  summary?: string;
  days: RoutinePlanDay[];
  error?: string;
  generatedAt?: IsoDateTime;
}

/** One of today's planned exercises, layered with how many of its sets have
 * actually been logged as completed today. */
export interface TodayRoutineExercise extends RoutinePlanExercise {
  /** Capped at `sets` — never more than what was prescribed. */
  completedSets: number;
  isCompleted: boolean;
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
  /** Same list as `day.exercises`, but with live completion — empty on a rest
   * day or when there's no plan yet. Render this, not `day.exercises`. */
  exercises: TodayRoutineExercise[];
  stepsToday: number;
  /** Earned from completed sets logged against today's plan. */
  caloriesBurned: number;
}
