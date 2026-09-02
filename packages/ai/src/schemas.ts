import { DayOfWeek, RoutineDayStatus } from '@fitness/types';
import { z } from 'zod';

export const quoteOfTheDaySchema = z.object({
  quoteOfTheDay: z.string().min(1).max(280),
});

export type QuoteOfTheDay = z.infer<typeof quoteOfTheDaySchema>;

export const routineExerciseSchema = z.object({
  // Nullable: a rest day sometimes comes back with one placeholder entry
  // instead of a true empty array — the app drops any exercise without a
  // real id rather than reject the whole week over it.
  exerciseId: z.string().nullable().optional(),
  // Never trust this for display — the app always looks the real name up
  // from the validated exerciseId. Kept only so the schema accepts whatever
  // the model sends alongside a placeholder/null exerciseId.
  exerciseName: z.string().nullable().optional(),
  // Nullable: duration-based cardio (a run, a bike ride) has no real "sets"
  // count — the app treats a missing value as 1 (one continuous effort).
  sets: z.number().int().min(1).max(10).nullable().optional(),
  // min(0) + nullable: models routinely send 0 (or null) instead of truly
  // omitting a field that doesn't apply — a rep-based exercise still gets a
  // durationSec key back, and vice versa. The app treats 0/null as unset.
  reps: z.number().int().min(0).max(100).nullable().optional(),
  durationSec: z.number().int().min(0).max(7200).nullable().optional(),
  restSeconds: z.number().int().min(0).max(600).nullable().optional(),
  /** Total kcal you estimate this user burns completing every prescribed set
   * of this exercise — the app credits it proportionally as sets are logged.
   * Optional/nullable so one skipped estimate doesn't fail the whole
   * generation; the app treats a missing value as 0. */
  estimatedCalories: z.number().int().min(0).max(2000).nullable().optional(),
});

export const routineDaySchema = z.object({
  dayOfWeek: z.enum(DayOfWeek),
  status: z.enum(RoutineDayStatus),
  /** Should equal caloriesFromRunning + caloriesFromExercises. */
  targetCaloriesBurned: z.number().int().min(0).max(5000),
  /** Portion of targetCaloriesBurned from running/walking/steps. Optional —
   * see `estimatedCalories`. */
  caloriesFromRunning: z.number().int().min(0).max(5000).nullable().optional(),
  /** Portion of targetCaloriesBurned from the strength/other exercises below. */
  caloriesFromExercises: z.number().int().min(0).max(5000).nullable().optional(),
  /** Every day gets one, rest days included — usually lower than a training day. */
  stepsTarget: z.number().int().min(0).max(50000).nullable().optional(),
  runningDistanceKm: z.number().min(0).max(100).nullable().optional(),
  runningDurationMin: z.number().int().min(0).max(600).nullable().optional(),
  focus: z.string().max(120),
  exercises: z.array(routineExerciseSchema).max(12),
});

export const weeklyRoutineSchema = z.object({
  /** Daily calorie *intake* target — separate from the burn targets on each day. */
  dailyCalorieTarget: z.number().int().min(0).max(10000),
  // A little headroom over the ~400-char instruction in the prompt — models
  // routinely overshoot a hard cap, especially when explaining fallback data.
  summary: z.string().max(600),
  days: z.array(routineDaySchema).length(7),
});

export type WeeklyRoutine = z.infer<typeof weeklyRoutineSchema>;
export type RoutineDay = z.infer<typeof routineDaySchema>;
export type RoutineExercise = z.infer<typeof routineExerciseSchema>;

export const dietMealItemSchema = z.object({
  name: z.string().min(1).max(120),
  /** Portion note where the name alone is ambiguous, e.g. "2 Roti", "1 cup". */
  description: z.string().max(120).nullable().optional(),
  calories: z.number().int().min(0).max(3000),
  proteinG: z.number().int().min(0).max(300),
  fatG: z.number().int().min(0).max(300),
  carbsG: z.number().int().min(0).max(600),
});

export const dietMealSchema = z.object({
  /** e.g. "Morning Breakfast", "Post-workout Snack". */
  name: z.string().min(1).max(80),
  // A little headroom over the prompt's stated "2 to 5 items" — days x meals
  // x items x fields nests four deep, so keeping the ceiling close to what's
  // actually asked for bounds how large (and how truncation/parse-failure
  // prone) one generation can get.
  items: z.array(dietMealItemSchema).min(1).max(6),
});

export const dietDaySchema = z.object({
  dayOfWeek: z.enum(DayOfWeek),
  /** Should equal the sum of every meal's item calories that day. */
  targetCalories: z.number().int().min(0).max(6000),
  targetProteinG: z.number().int().min(0).max(400).nullable().optional(),
  targetFatG: z.number().int().min(0).max(400).nullable().optional(),
  targetCarbsG: z.number().int().min(0).max(800).nullable().optional(),
  // Headroom over the prompt's stated "3 to 6 meals" — see `items` above.
  meals: z.array(dietMealSchema).min(1).max(6),
});

export const weeklyDietSchema = z.object({
  // A little headroom over the ~400-char instruction in the prompt — models
  // routinely overshoot a hard cap, especially when explaining fallback data.
  summary: z.string().max(600),
  days: z.array(dietDaySchema).length(7),
});

export type WeeklyDiet = z.infer<typeof weeklyDietSchema>;
export type AiDietDay = z.infer<typeof dietDaySchema>;
export type AiDietMeal = z.infer<typeof dietMealSchema>;
export type AiDietMealItem = z.infer<typeof dietMealItemSchema>;
