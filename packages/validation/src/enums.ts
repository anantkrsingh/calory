import {
  ActivityLevel,
  Equipment,
  ExerciseCategory,
  FitnessGoal,
  GoalStatus,
  GoalType,
  MEASUREMENT_SITES,
  MuscleGroup,
  ChatMessageRole,
  PromptCategory,
  SetType,
  Sex,
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
export const userRoleSchema = z.enum(UserRole);
export const muscleGroupSchema = z.enum(MuscleGroup);
export const equipmentSchema = z.enum(Equipment);
export const exerciseCategorySchema = z.enum(ExerciseCategory);
export const setTypeSchema = z.enum(SetType);
export const workoutStatusSchema = z.enum(WorkoutStatus);
export const goalTypeSchema = z.enum(GoalType);
export const goalStatusSchema = z.enum(GoalStatus);
export const promptCategorySchema = z.enum(PromptCategory);
export const chatMessageRoleSchema = z.enum(ChatMessageRole);
export const measurementSiteSchema = z.enum(MEASUREMENT_SITES);
