import type { DayOfWeek } from './enums';
import type { Entity, Id, IsoDate, IsoDateTime } from './common';

export const QUOTE_QUEUE_NAME = 'quote';
export const ROUTINE_QUEUE_NAME = 'routine';
export const ROUTINE_RECONCILE_QUEUE_NAME = 'routine-reconcile';
export const DIET_PLAN_QUEUE_NAME = 'diet-plan';

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

/**
 * A diet plan is AI-generated only — there's no manual create/edit UI for it
 * the way `Routine` templates have one, so unlike `WorkoutRoutine` it's never
 * requested automatically at registration either: the user asks for one
 * (`Create my diet plan`) whenever they want it.
 */
export const DietPlanStatus = {
  Generating: 'generating',
  Active: 'active',
  Failed: 'failed',
  Superseded: 'superseded',
} as const;
export type DietPlanStatus =
  (typeof DietPlanStatus)[keyof typeof DietPlanStatus];

export interface DietPlanJobData {
  userId: Id;
  dietPlanId: Id;
}

export interface DietPlanJobResult {
  dietPlanId: Id;
  status: DietPlanStatus;
}

export interface DietMealItem {
  id: Id;
  /** e.g. "Bread Toast", "Yogurt". */
  name: string;
  /** Portion note where a plain name is ambiguous, e.g. "2 Roti", "1 cup". */
  description?: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface DietMeal {
  id: Id;
  /** e.g. "Morning Breakfast". */
  name: string;
  items: DietMealItem[];
  /** Sum of the item macros — stored alongside the items so the UI never has
   * to re-total them, same convention as `RoutineDay.caloriesFromExercises`. */
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbsG: number;
}

export interface DietPlanDay {
  dayOfWeek: DayOfWeek;
  meals: DietMeal[];
  targetCalories: number;
  targetProteinG?: number;
  targetFatG?: number;
  targetCarbsG?: number;
}

export interface DietPlan extends Entity {
  userId: Id;
  status: DietPlanStatus;
  summary?: string;
  days: DietPlanDay[];
  error?: string;
  generatedAt?: IsoDateTime;
}

/** Which of today's meal items the user has actually marked eaten — kept
 * separate from the `DietPlan` template (the same weekday recurs every week)
 * so "taken" resets on its own each calendar day, the same way completed
 * workout sets are tracked apart from `WorkoutRoutine`. */
export interface TodayDiet {
  planStatus: DietPlanStatus | null;
  date: IsoDate;
  day?: DietPlanDay;
  /** `DietMealItem.id`s marked taken on this calendar date. */
  takenItemIds: Id[];
}
