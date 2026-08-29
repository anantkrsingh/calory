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
}

/** 1 = Monday .. 7 = Sunday. */
export interface RoutinePlanDay {
  dayOfWeek: number;
  isRestDay: boolean;
  targetCaloriesBurned: number;
  focus: string;
  exercises: RoutinePlanExercise[];
}

export interface WorkoutRoutine extends Entity {
  userId: Id;
  status: WorkoutRoutineStatus;
  /** Daily calorie intake target. */
  dailyCalorieTarget?: number;
  /** Daily step count target. Per-day calorie burn target lives on each day. */
  dailyStepsTarget?: number;
  summary?: string;
  days: RoutinePlanDay[];
  error?: string;
  generatedAt?: IsoDateTime;
}
