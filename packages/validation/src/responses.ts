import { z } from 'zod';

import {
  activityLevelSchema,
  chatMessageRoleSchema,
  equipmentSchema,
  exerciseCategorySchema,
  goalStatusSchema,
  goalTypeSchema,
  measurementSiteSchema,
  muscleGroupSchema,
  promptCategorySchema,
  setTypeSchema,
  sexSchema,
  unitSystemSchema,
  userRoleSchema,
  workoutStatusSchema,
} from './enums';
import { exerciseInstructionStepSchema } from './exercise';
import { isoDateSchema, isoDateTimeSchema, objectIdSchema } from './primitives';

const entityFields = {
  id: objectIdSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
};

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), meta: paginationMetaSchema });

export const apiErrorSchema = z.object({
  statusCode: z.number().int(),
  message: z.string(),
  error: z.string(),
  path: z.string(),
  timestamp: isoDateTimeSchema,
  details: z.record(z.string(), z.array(z.string())).optional(),
});

export const userProfileResponseSchema = z.object({
  displayName: z.string(),
  avatarUrl: z.string().optional(),
  dateOfBirth: isoDateSchema.optional(),
  sex: sexSchema.optional(),
  heightCm: z.number().optional(),
  activityLevel: activityLevelSchema.optional(),
});

export const userPreferencesResponseSchema = z.object({
  units: unitSystemSchema,
  timezone: z.string(),
  notificationsEnabled: z.boolean(),
});

export const userSchema = z.object({
  ...entityFields,
  email: z.email(),
  emailVerified: z.boolean(),
  role: userRoleSchema,
  profile: userProfileResponseSchema,
  preferences: userPreferencesResponseSchema,
});

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: isoDateTimeSchema,
});

export const authSessionSchema = z.object({
  user: userSchema,
  tokens: authTokensSchema,
});

export const pendingVerificationSchema = z.object({
  userId: objectIdSchema,
  email: z.email(),
  emailVerified: z.literal(false),
  otpSent: z.boolean(),
});

export const exerciseSchema = z.object({
  ...entityFields,
  name: z.string(),
  category: exerciseCategorySchema,
  primaryMuscles: z.array(muscleGroupSchema),
  secondaryMuscles: z.array(muscleGroupSchema),
  equipment: equipmentSchema,
  instructions: z.string().optional(),
  instructionSteps: z.array(exerciseInstructionStepSchema),
  thumbnail: z.string().optional(),
  images: z.array(z.string()),
  createdBy: objectIdSchema.nullable(),
  isCustom: z.boolean(),
  isFavorite: z.boolean(),
});

export const exerciseMuscleGroupSchema = z.object({
  muscle: muscleGroupSchema,
  exercises: z.array(exerciseSchema),
});

export const exerciseCatalogueSchema = z.object({
  favorites: z.array(exerciseSchema),
  groups: z.array(exerciseMuscleGroupSchema),
});

export const exercisePersonalRecordSchema = z.object({
  exerciseId: objectIdSchema,
  exerciseName: z.string(),
  bestWeightKg: z.number().optional(),
  bestReps: z.number().int().optional(),
  bestEstimatedOneRepMaxKg: z.number().optional(),
  bestVolumeKg: z.number().optional(),
  bestDistanceM: z.number().optional(),
  bestDurationSec: z.number().int().optional(),
  achievedAt: isoDateTimeSchema,
});

export const workoutSetResponseSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  type: setTypeSchema,
  reps: z.number().int().optional(),
  weightKg: z.number().optional(),
  durationSec: z.number().int().optional(),
  distanceM: z.number().optional(),
  rpe: z.number().optional(),
  completed: z.boolean(),
  notes: z.string().optional(),
});

export const workoutExerciseResponseSchema = z.object({
  id: z.string(),
  exerciseId: objectIdSchema,
  exerciseName: z.string(),
  order: z.number().int(),
  sets: z.array(workoutSetResponseSchema),
  restSeconds: z.number().int().optional(),
  notes: z.string().optional(),
});

export const workoutStatsSchema = z.object({
  totalSets: z.number().int(),
  completedSets: z.number().int(),
  totalVolumeKg: z.number(),
  totalReps: z.number().int(),
  totalDistanceM: z.number(),
  totalDurationSec: z.number().int(),
});

export const workoutSchema = z.object({
  ...entityFields,
  userId: objectIdSchema,
  name: z.string(),
  status: workoutStatusSchema,
  startedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.optional(),
  durationSec: z.number().int().optional(),
  exercises: z.array(workoutExerciseResponseSchema),
  stats: workoutStatsSchema,
  notes: z.string().optional(),
  routineId: objectIdSchema.optional(),
});

export const workoutSummarySchema = z.object({
  id: objectIdSchema,
  name: z.string(),
  status: workoutStatusSchema,
  startedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.optional(),
  durationSec: z.number().int().optional(),
  exerciseCount: z.number().int(),
  stats: workoutStatsSchema,
});

export const routineSetResponseSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  type: setTypeSchema,
  targetReps: z.number().int().optional(),
  targetWeightKg: z.number().optional(),
  targetDurationSec: z.number().int().optional(),
  targetDistanceM: z.number().optional(),
});

export const routineExerciseResponseSchema = z.object({
  id: z.string(),
  exerciseId: objectIdSchema,
  exerciseName: z.string(),
  order: z.number().int(),
  sets: z.array(routineSetResponseSchema),
  restSeconds: z.number().int().optional(),
  notes: z.string().optional(),
});

export const routineSchema = z.object({
  ...entityFields,
  userId: objectIdSchema,
  name: z.string(),
  description: z.string().optional(),
  targetMuscles: z.array(muscleGroupSchema),
  exercises: z.array(routineExerciseResponseSchema),
  estimatedDurationSec: z.number().int().optional(),
  isArchived: z.boolean(),
  lastPerformedAt: isoDateTimeSchema.optional(),
});

export const routineSummarySchema = z.object({
  id: objectIdSchema,
  name: z.string(),
  description: z.string().optional(),
  exerciseCount: z.number().int(),
  targetMuscles: z.array(muscleGroupSchema),
  estimatedDurationSec: z.number().int().optional(),
  lastPerformedAt: isoDateTimeSchema.optional(),
});

export const bodyMeasurementSchema = z.object({
  ...entityFields,
  userId: objectIdSchema,
  recordedAt: isoDateTimeSchema,
  weightKg: z.number().optional(),
  bodyFatPercentage: z.number().optional(),
  measurements: z.partialRecord(measurementSiteSchema, z.number()),
  photoUrls: z.array(z.string()),
  notes: z.string().optional(),
});

export const dailyStepsSchema = z.object({
  ...entityFields,
  userId: objectIdSchema,
  date: isoDateSchema,
  steps: z.number().int(),
});

export const stepsSummarySchema = z.object({
  date: isoDateSchema,
  steps: z.number().int(),
  goal: z.number().int(),
});

export const measurementTrendSchema = z.object({
  metric: z.union([
    z.literal('weightKg'),
    z.literal('bodyFatPercentage'),
    measurementSiteSchema,
  ]),
  points: z.array(
    z.object({ recordedAt: isoDateTimeSchema, value: z.number() }),
  ),
  change: z.number(),
  changePercentage: z.number(),
});

export const goalSchema = z.object({
  ...entityFields,
  userId: objectIdSchema,
  type: goalTypeSchema,
  title: z.string(),
  targetValue: z.number(),
  startValue: z.number(),
  currentValue: z.number(),
  unit: z.string(),
  deadline: isoDateSchema.optional(),
  status: goalStatusSchema,
  achievedAt: isoDateTimeSchema.optional(),
  exerciseId: objectIdSchema.optional(),
});

export const goalProgressSchema = z.object({
  goalId: objectIdSchema,
  percentage: z.number(),
  remaining: z.number(),
  isOnTrack: z.boolean(),
});

export const volumeByMuscleGroupSchema = z.object({
  muscleGroup: muscleGroupSchema,
  volumeKg: z.number(),
  setCount: z.number().int(),
});

export const dailyActivitySchema = z.object({
  date: isoDateSchema,
  workoutCount: z.number().int(),
  volumeKg: z.number(),
  durationSec: z.number().int(),
});

export const workoutStreakSchema = z.object({
  currentDays: z.number().int(),
  longestDays: z.number().int(),
  lastWorkoutAt: isoDateTimeSchema.optional(),
});

export const dashboardStatsSchema = z.object({
  userId: objectIdSchema,
  workoutsThisWeek: z.number().int(),
  weeklyTarget: z.number().int(),
  totalWorkouts: z.number().int(),
  totalVolumeKg: z.number(),
  totalDurationSec: z.number().int(),
  streak: workoutStreakSchema,
  volumeByMuscleGroup: z.array(volumeByMuscleGroupSchema),
  recentActivity: z.array(dailyActivitySchema),
});

export const dailyQuoteSchema = z.object({
  ...entityFields,
  date: isoDateSchema,
  quoteOfTheDay: z.string(),
});

export const routinePlanExerciseSchema = z.object({
  exerciseId: objectIdSchema,
  exerciseName: z.string(),
  sets: z.number().int(),
  reps: z.number().int().optional(),
  durationSec: z.number().int().optional(),
  restSeconds: z.number().int().optional(),
  estimatedCalories: z.number().int(),
});

export const routinePlanDaySchema = z.object({
  dayOfWeek: z.number().int(),
  isRestDay: z.boolean(),
  targetCaloriesBurned: z.number().int(),
  caloriesFromRunning: z.number().int(),
  caloriesFromExercises: z.number().int(),
  stepsTarget: z.number().int(),
  runningDistanceKm: z.number().optional(),
  runningDurationMin: z.number().int().optional(),
  focus: z.string(),
  exercises: z.array(routinePlanExerciseSchema),
});

export const workoutRoutineSchema = z.object({
  ...entityFields,
  userId: objectIdSchema,
  status: z.enum(['generating', 'active', 'failed', 'superseded']),
  dailyCalorieTarget: z.number().int().optional(),
  caloriesPerStep: z.number().optional(),
  summary: z.string().optional(),
  days: z.array(routinePlanDaySchema),
  error: z.string().optional(),
  generatedAt: isoDateTimeSchema.optional(),
});

export const todayRoutineCaloriesSchema = z.object({
  fromSteps: z.number(),
  fromExercises: z.number(),
  total: z.number(),
});

export const todayRoutineSchema = z.object({
  routineStatus: z
    .enum(['generating', 'active', 'failed', 'superseded'])
    .nullable(),
  date: isoDateSchema,
  dailyCalorieTarget: z.number().int().optional(),
  day: routinePlanDaySchema.optional(),
  stepsToday: z.number().int(),
  caloriesBurned: todayRoutineCaloriesSchema,
});

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  uptimeSec: z.number().int(),
  database: z.enum(['up', 'down']),
  timestamp: isoDateTimeSchema,
});

export const appSettingsSchema = z.object({
  ...entityFields,
  freeChatsLimit: z.number().int(),
  aiPrompts: z.array(
    z.object({
      promptCategory: promptCategorySchema,
      prompt: z.string(),
    }),
  ),
});

export const chatConversationSchema = z.object({
  ...entityFields,
  userId: objectIdSchema,
  title: z.string().optional(),
  messageCount: z.number().int(),
  lastMessageAt: isoDateTimeSchema.optional(),
});

export const chatMessageSchema = z.object({
  ...entityFields,
  conversationId: objectIdSchema,
  role: chatMessageRoleSchema,
  content: z.string(),
});

export const chatConversationDetailSchema = chatConversationSchema.extend({
  messages: z.array(chatMessageSchema),
});

export const otpSendResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export const otpVerifyResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  userId: objectIdSchema.optional(),
});
