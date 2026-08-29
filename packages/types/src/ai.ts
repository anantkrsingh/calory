import type { DayOfWeek } from './enums';
import type { Entity, Id, IsoDate, IsoDateTime } from './common';

export const QUOTE_QUEUE_NAME = 'quote';
export const ROUTINE_QUEUE_NAME = 'routine';
export const ROUTINE_RECONCILE_QUEUE_NAME = 'routine-reconcile';

export const WorkoutRoutineStatus = {
  Generating: 'generating',
  Active: 'active',
  Failed: 'failed',
  Superseded: 'superseded',
} as const;
export type WorkoutRoutineStatus =
  (typeof WorkoutRoutineStatus)[keyof typeof WorkoutRoutineStatus];


export const RoutineDayStatus = {
  Active: 'active',
  Rest: 'rest',
} as const;
export type RoutineDayStatus =
  (typeof RoutineDayStatus)[keyof typeof RoutineDayStatus];

export interface QuoteJobData {
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
  queued: number;
  neverGenerated: number;
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
  estimatedCalories: number;
}

export interface RoutinePlanDay {
  dayOfWeek: DayOfWeek;
  status: RoutineDayStatus;
  targetCaloriesBurned: number;
  caloriesFromRunning: number;
  caloriesFromExercises: number;
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

export interface TodayRoutineExercise extends RoutinePlanExercise {
  completedSets: number;
  isCompleted: boolean;
  thumbnail?: string;
}

/** Calories credited from completed sets on one calendar day, alongside that
 * day's plan target — the basis for the home screen's weekly calorie strip
 * and the weekly-progress history sheet. */
export interface DailyCaloriesBurned {
  date: IsoDate;
  caloriesBurned: number;
  /** From that weekday's plan; 0 if there's no plan for it (e.g. no active routine). */
  targetCaloriesBurned: number;
}

export interface TodayRoutine {
  routineStatus: WorkoutRoutineStatus | null;
  date: IsoDate;
  dailyCalorieTarget?: number;
  day?: RoutinePlanDay;

  exercises: TodayRoutineExercise[];
  stepsToday: number;

  caloriesBurned: number;
}
