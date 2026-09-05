import type {
  AppSettings,
  BodyMeasurement,
  ChatConversation,
  ChatMessage,
  DailyQuote,
  DailySteps,
  DietPlan,
  Exercise,
  ExerciseLogFields,
  Goal,
  Plan,
  Routine,
  User,
  Workout,
  WorkoutRoutine,
  WorkoutSummary,
} from '@fitness/types';

import type {
  AppSettingsRow,
  BodyMeasurementRow,
  ChatConversationRow,
  ChatMessageRow,
  DailyQuoteRow,
  DailyStepsRow,
  DietPlanRow,
  ExerciseRow,
  GoalRow,
  PlanRow,
  RoutineRow,
  UserRow,
  WorkoutRoutineRow,
  WorkoutRow,
} from './rows';

/**
 * Prisma hands back `Date` objects and nullable columns; the wire contracts in
 * `@fitness/types` use ISO strings and optional properties. These mappers are the
 * single place that translation happens, so a controller can never leak a `Date`
 * or a `null` the mobile app is not typed for.
 */

const iso = (value: Date): string => value.toISOString();
const isoOrUndefined = (value: Date | null): string | undefined =>
  value === null ? undefined : value.toISOString();
const orUndefined = <T>(value: T | null): T | undefined =>
  value === null ? undefined : value;

/** Strips `undefined` entries so the result matches `Partial<Record<...>>`. */
function compact<T extends Record<string, unknown>>(input: T): T {
  const output = {} as T;
  for (const [key, value] of Object.entries(input)) {
    if (value !== null && value !== undefined) {
      output[key as keyof T] = value as T[keyof T];
    }
  }
  return output;
}

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    emailVerified: row.emailVerified,
    role: row.role,
    profile: compact({
      displayName: row.profile.displayName,
      avatarUrl: orUndefined(row.profile.avatarUrl),
      dateOfBirth: orUndefined(row.profile.dateOfBirth),
      sex: orUndefined(row.profile.sex),
      heightCm: orUndefined(row.profile.heightCm),
      activityLevel: orUndefined(row.profile.activityLevel),
      fitnessGoals: row.profile.fitnessGoals?.length
        ? row.profile.fitnessGoals
        : undefined,
    }) as User['profile'],
    preferences: {
      units: row.preferences.units,
      timezone: row.preferences.timezone,
      notificationsEnabled: row.preferences.notificationsEnabled,
    },
    totalCredits: row.totalCredits ?? 5,
    remainingCredits: row.remainingCredits ?? 5,
    planId: orUndefined(row.planId),
    planName: orUndefined(row.planName),
    planExpiresAt: isoOrUndefined(row.planExpiresAt),
    lifetimeInputTokens: row.lifetimeInputTokens ?? 0,
    lifetimeOutputTokens: row.lifetimeOutputTokens ?? 0,
    lifetimeTotalTokens: row.lifetimeTotalTokens ?? 0,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    name: row.name,
    description: orUndefined(row.description),
    duration: row.duration,
    durationDays: orUndefined(row.durationDays),
    price: row.price,
    currency: row.currency,
    benefits: row.benefits ?? [],
    storeProductId: orUndefined(row.storeProductId),
    isActive: row.isActive,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

/** Exercises created before `logFields` existed have none stored — read back
 * as "nothing applies" rather than erroring. Also the merge base when
 * patching `logFields` on a row that predates it (see `ExercisesService.update`). */
export const DEFAULT_LOG_FIELDS: ExerciseLogFields = {
  reps: 'hidden',
  weightKg: 'hidden',
  sets: 'hidden',
  durationSec: 'hidden',
  distanceM: 'hidden',
};

/** `isFavorite` is contextual to the requesting user, so it's never on the
 * row itself — pass whether the caller has this exercise in their favorites. */
export function toExercise(row: ExerciseRow, isFavorite = false): Exercise {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    primaryMuscles: row.primaryMuscles,
    secondaryMuscles: row.secondaryMuscles,
    equipment: row.equipment,
    instructions: orUndefined(row.instructions),
    instructionSteps: row.instructionSteps
      .map((step) => ({
        id: step.id,
        order: step.order,
        text: step.text,
        image: orUndefined(step.image),
      }))
      .sort((a, b) => a.order - b.order),
    thumbnail: orUndefined(row.thumbnail),
    images: row.images ?? [],
    createdBy: row.createdById,
    isCustom: row.isCustom,
    isFavorite,
    logFields: row.logFields ?? DEFAULT_LOG_FIELDS,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    status: row.status,
    startedAt: iso(row.startedAt),
    completedAt: isoOrUndefined(row.completedAt),
    durationSec: orUndefined(row.durationSec),
    exercises: row.exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      order: exercise.order,
      restSeconds: orUndefined(exercise.restSeconds),
      notes: orUndefined(exercise.notes),
      sets: exercise.sets.map((set) => ({
        id: set.id,
        order: set.order,
        type: set.type,
        reps: orUndefined(set.reps),
        weightKg: orUndefined(set.weightKg),
        durationSec: orUndefined(set.durationSec),
        distanceM: orUndefined(set.distanceM),
        rpe: orUndefined(set.rpe),
        completed: set.completed,
        notes: orUndefined(set.notes),
      })),
    })),
    stats: {
      totalSets: row.stats.totalSets,
      completedSets: row.stats.completedSets,
      totalVolumeKg: row.stats.totalVolumeKg,
      totalReps: row.stats.totalReps,
      totalDistanceM: row.stats.totalDistanceM,
      totalDurationSec: row.stats.totalDurationSec,
    },
    notes: orUndefined(row.notes),
    routineId: orUndefined(row.routineId),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

/** List projection — drops the set tree, which dominates the payload size. */
export function toWorkoutSummary(row: WorkoutRow): WorkoutSummary {
  const workout = toWorkout(row);
  return {
    id: workout.id,
    name: workout.name,
    status: workout.status,
    startedAt: workout.startedAt,
    completedAt: workout.completedAt,
    durationSec: workout.durationSec,
    exerciseCount: workout.exercises.length,
    stats: workout.stats,
  };
}

export function toRoutine(row: RoutineRow): Routine {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: orUndefined(row.description),
    targetMuscles: row.targetMuscles,
    exercises: row.exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      order: exercise.order,
      restSeconds: orUndefined(exercise.restSeconds),
      notes: orUndefined(exercise.notes),
      sets: exercise.sets.map((set) => ({
        id: set.id,
        order: set.order,
        type: set.type,
        targetReps: orUndefined(set.targetReps),
        targetWeightKg: orUndefined(set.targetWeightKg),
        targetDurationSec: orUndefined(set.targetDurationSec),
        targetDistanceM: orUndefined(set.targetDistanceM),
      })),
    })),
    estimatedDurationSec: orUndefined(row.estimatedDurationSec),
    isArchived: row.isArchived,
    lastPerformedAt: isoOrUndefined(row.lastPerformedAt),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toBodyMeasurement(row: BodyMeasurementRow): BodyMeasurement {
  return {
    id: row.id,
    userId: row.userId,
    recordedAt: iso(row.recordedAt),
    weightKg: orUndefined(row.weightKg),
    bodyFatPercentage: orUndefined(row.bodyFatPercentage),
    measurements: compact({
      neck: row.measurements.neck,
      chest: row.measurements.chest,
      waist: row.measurements.waist,
      hips: row.measurements.hips,
      leftArm: row.measurements.leftArm,
      rightArm: row.measurements.rightArm,
      leftThigh: row.measurements.leftThigh,
      rightThigh: row.measurements.rightThigh,
      leftCalf: row.measurements.leftCalf,
      rightCalf: row.measurements.rightCalf,
    }) as BodyMeasurement['measurements'],
    photoUrls: row.photoUrls,
    notes: orUndefined(row.notes),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toDailySteps(row: DailyStepsRow): DailySteps {
  return {
    id: row.id,
    userId: row.userId,
    date: row.date,
    steps: row.steps,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toAppSettings(row: AppSettingsRow): AppSettings {
  return {
    id: row.id,
    freeChatsLimit: row.freeChatsLimit,
    aiPrompts: row.aiPrompts
      .filter(
        (prompt): prompt is typeof prompt & { promptCategory: NonNullable<typeof prompt.promptCategory> } =>
          Boolean(prompt.promptCategory),
      )
      .map((prompt) => ({
        promptCategory: prompt.promptCategory,
        prompt: prompt.prompt,
      })),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toDailyQuote(row: DailyQuoteRow): DailyQuote {
  return {
    id: row.id,
    date: row.date,
    quoteOfTheDay: row.quoteOfTheDay,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toWorkoutRoutine(row: WorkoutRoutineRow): WorkoutRoutine {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status,
    dailyCalorieTarget: orUndefined(row.dailyCalorieTarget),
    summary: orUndefined(row.summary),
    days: row.days.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      status: day.status,
      targetCaloriesBurned: day.targetCaloriesBurned,
      // Absent on routines generated before these fields existed.
      caloriesFromRunning: day.caloriesFromRunning ?? 0,
      caloriesFromExercises: day.caloriesFromExercises ?? 0,
      stepsTarget: day.stepsTarget ?? 0,
      runningDistanceKm: orUndefined(day.runningDistanceKm),
      runningDurationMin: orUndefined(day.runningDurationMin),
      focus: day.focus,
      exercises: day.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        sets: exercise.sets,
        reps: orUndefined(exercise.reps),
        durationSec: orUndefined(exercise.durationSec),
        restSeconds: orUndefined(exercise.restSeconds),
        estimatedCalories: exercise.estimatedCalories ?? 0,
      })),
    })),
    error: orUndefined(row.error),
    generatedAt: isoOrUndefined(row.generatedAt),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toDietPlan(row: DietPlanRow): DietPlan {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status,
    summary: orUndefined(row.summary),
    dietTypes: row.dietTypes,
    cuisine: row.cuisine,
    exclude: row.exclude,
    mealsPerDay: row.mealsPerDay,
    days: row.days.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      targetCalories: day.targetCalories,
      targetProteinG: orUndefined(day.targetProteinG),
      targetFatG: orUndefined(day.targetFatG),
      targetCarbsG: orUndefined(day.targetCarbsG),
      meals: day.meals.map((meal) => ({
        id: meal.id,
        name: meal.name,
        totalCalories: meal.totalCalories,
        totalProteinG: meal.totalProteinG,
        totalFatG: meal.totalFatG,
        totalCarbsG: meal.totalCarbsG,
        items: meal.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: orUndefined(item.description),
          calories: item.calories,
          proteinG: item.proteinG,
          fatG: item.fatG,
          carbsG: item.carbsG,
        })),
      })),
    })),
    error: orUndefined(row.error),
    generatedAt: isoOrUndefined(row.generatedAt),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    targetValue: row.targetValue,
    startValue: row.startValue,
    currentValue: row.currentValue,
    unit: row.unit,
    deadline: orUndefined(row.deadline),
    status: row.status,
    achievedAt: isoOrUndefined(row.achievedAt),
    exerciseId: orUndefined(row.exerciseId),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toChatConversation(row: ChatConversationRow): ChatConversation {
  return {
    id: row.id,
    userId: row.userId,
    title: orUndefined(row.title),
    messageCount: row.messageCount,
    lastMessageAt: isoOrUndefined(row.lastMessageAt),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toChatMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role,
    content: row.content,
    inputTokens: orUndefined(row.inputTokens),
    outputTokens: orUndefined(row.outputTokens),
    totalTokens: orUndefined(row.totalTokens),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}
