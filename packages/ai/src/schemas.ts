import { z } from 'zod';

export const quoteOfTheDaySchema = z.object({
  quoteOfTheDay: z.string().min(1).max(280),
});

export type QuoteOfTheDay = z.infer<typeof quoteOfTheDaySchema>;

export const routineDaySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  isRestDay: z.boolean(),
  targetCaloriesBurned: z.number().int().min(0).max(5000),
  focus: z.string().max(120),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string(),
        exerciseName: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(100).optional(),
        durationSec: z.number().int().min(1).max(7200).optional(),
        restSeconds: z.number().int().min(0).max(600).optional(),
      }),
    )
    .max(12),
});

export const weeklyRoutineSchema = z.object({
  dailyCalorieTarget: z.number().int().min(0).max(10000),
  summary: z.string().max(500),
  days: z.array(routineDaySchema).length(7),
});

export type WeeklyRoutine = z.infer<typeof weeklyRoutineSchema>;
export type RoutineDay = z.infer<typeof routineDaySchema>;
