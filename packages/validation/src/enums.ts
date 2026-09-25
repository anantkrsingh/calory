import {
  ActivityLevel,
  AuthProvider,
  DayOfWeek,
  DevicePlatform,
  DietCuisine,
  DietType,
  Equipment,
  ExerciseCategory,
  ExerciseLogFieldRequirement,
  FitnessGoal,
  GoalStatus,
  GoalType,
  LlmProvider,
  MEASUREMENT_SITES,
  MuscleGroup,
  ChatMessageRole,
  NotificationCampaignStatus,
  NotificationDeliveryStatus,
  NotificationTargetPlatform,
  NotificationTargetType,
  PromptCategory,
  RoutineDayStatus,
  SetType,
  Sex,
  TicketStatus,
  TicketTimelineActorRole,
  TicketTimelineEventType,
  UnitSystem,
  UserRole,
  WorkoutStatus,
} from '@fitness/types';
import { z } from 'zod';

/**
 * Enum schemas are derived from the `@fitness/types` const objects, so adding a
 * member there is automatically accepted here — the two cannot drift.
 */
export const unitSystemSchema = z.enum(UnitSystem);
export const sexSchema = z.enum(Sex);
export const activityLevelSchema = z.enum(ActivityLevel);
export const fitnessGoalSchema = z.enum(FitnessGoal);
export const authProviderSchema = z.enum(AuthProvider);
export const userRoleSchema = z.enum(UserRole);
export const ticketStatusSchema = z.enum(TicketStatus);
export const ticketTimelineEventTypeSchema = z.enum(TicketTimelineEventType);
export const ticketTimelineActorRoleSchema = z.enum(TicketTimelineActorRole);
export const muscleGroupSchema = z.enum(MuscleGroup);
export const equipmentSchema = z.enum(Equipment);
export const exerciseCategorySchema = z.enum(ExerciseCategory);
export const exerciseLogFieldRequirementSchema = z.enum(
  ExerciseLogFieldRequirement,
);
export const setTypeSchema = z.enum(SetType);
export const workoutStatusSchema = z.enum(WorkoutStatus);
export const goalTypeSchema = z.enum(GoalType);
export const goalStatusSchema = z.enum(GoalStatus);
export const promptCategorySchema = z.enum(PromptCategory);
export const chatMessageRoleSchema = z.enum(ChatMessageRole);
export const measurementSiteSchema = z.enum(MEASUREMENT_SITES);
export const dayOfWeekSchema = z.enum(DayOfWeek);
export const routineDayStatusSchema = z.enum(RoutineDayStatus);
export const dietTypeSchema = z.enum(DietType);
export const dietCuisineSchema = z.enum(DietCuisine);
export const notificationTargetTypeSchema = z.enum(NotificationTargetType);
export const notificationTargetPlatformSchema = z.enum(
  NotificationTargetPlatform,
);
export const notificationCampaignStatusSchema = z.enum(
  NotificationCampaignStatus,
);
export const notificationDeliveryStatusSchema = z.enum(
  NotificationDeliveryStatus,
);
export const devicePlatformSchema = z.enum(DevicePlatform);
export const llmProviderSchema = z.enum(LlmProvider);
