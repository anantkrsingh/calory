import { LIMITS } from '@fitness/config';
import { z } from 'zod';

import { activityLevelSchema, sexSchema, unitSystemSchema } from './enums';
import { isoDateSchema } from './primitives';

export const userProfileSchema = z.object({
  displayName: z.string().trim().min(LIMITS.name.min).max(LIMITS.name.max),
  avatarUrl: z.url().optional(),
  dateOfBirth: isoDateSchema.optional(),
  sex: sexSchema.optional(),
  heightCm: z
    .number()
    .min(LIMITS.heightCm.min)
    .max(LIMITS.heightCm.max)
    .optional(),
  activityLevel: activityLevelSchema.optional(),
});

export const userPreferencesSchema = z.object({
  units: unitSystemSchema.default('metric'),
  timezone: z.string().min(1).default('UTC'),
  weeklyWorkoutTarget: z.number().int().min(0).max(21).default(3),
  restTimerSeconds: z.number().int().min(0).max(600).default(90),
  notificationsEnabled: z.boolean().default(true),
});

export const updateProfileSchema = userProfileSchema.partial();

export const updatePreferencesSchema = userPreferencesSchema.partial();

export const updateUserSchema = z.object({
  profile: updateProfileSchema.optional(),
  preferences: updatePreferencesSchema.optional(),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
