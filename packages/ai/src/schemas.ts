import { z } from 'zod';

export const quoteOfTheDaySchema = z.object({
  quoteOfTheDay: z.string().min(1).max(280),
});

export type QuoteOfTheDay = z.infer<typeof quoteOfTheDaySchema>;

export const routineExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  sets: z.number().int().min(1).max(10),
  reps: z.number().int().min(1).max(100).optional(),
  durationSec: z.number().int().min(1).max(7200).optional(),
  restSeconds: z.number().int().min(0).max(600).optional(),
  /** Total kcal you estimate this user burns completing every prescribed set
   * of this exercise — the app credits it proportionally as sets are logged. */
  estimatedCalories: z.number().int().min(0).max(2000),
});

export const routineDaySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  isRestDay: z.boolean(),
  /** Must equal caloriesFromRunning + caloriesFromExercises. */
  targetCaloriesBurned: z.number().int().min(0).max(5000),
  /** Portion of targetCaloriesBurned from running/walking/steps. */
  caloriesFromRunning: z.number().int().min(0).max(5000),
  /** Portion of targetCaloriesBurned from the strength/other exercises below. */
  caloriesFromExercises: z.number().int().min(0).max(5000),
  /** Every day gets one, rest days included — usually lower than a training day. */
  stepsTarget: z.number().int().min(0).max(50000),
  runningDistanceKm: z.number().min(0).max(100).optional(),
  runningDurationMin: z.number().int().min(0).max(600).optional(),
  focus: z.string().max(120),
  exercises: z.array(routineExerciseSchema).max(12),
});

export const weeklyRoutineSchema = z.object({
  /** Daily calorie *intake* target — separate from the burn targets on each day. */
  dailyCalorieTarget: z.number().int().min(0).max(10000),
  /** Kcal you estimate this user burns per step, from their weight/BMI — the
   * app multiplies a live step count by this for a live calories-burned figure. */
  caloriesPerStep: z.number().min(0).max(2),
  summary: z.string().max(500),
  days: z.array(routineDaySchema).length(7),
});

export type WeeklyRoutine = z.infer<typeof weeklyRoutineSchema>;
export type RoutineDay = z.infer<typeof routineDaySchema>;
export type RoutineExercise = z.infer<typeof routineExerciseSchema>;
