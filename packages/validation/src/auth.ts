import { AUTH, LIMITS } from '@fitness/config';
import { z } from 'zod';

import { createMeasurementSchema } from './measurement';
import { userProfileSchema } from './user';

export const emailSchema = z.email().trim().toLowerCase();

export const passwordSchema = z
  .string()
  .min(
    AUTH.minPasswordLength,
    `Password must be at least ${AUTH.minPasswordLength} characters`,
  )
  .max(AUTH.maxPasswordLength)
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerProfileSchema = userProfileSchema
  .omit({ displayName: true })
  .partial();

export const registerMeasurementSchema = createMeasurementSchema;

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z
    .string()
    .trim()
    .min(LIMITS.name.min)
    .max(LIMITS.name.max),
  profile: registerProfileSchema.optional(),
  measurement: registerMeasurementSchema.optional(),
});

export const verifyRegistrationSchema = z.object({
  email: emailSchema,
  code: z.string().min(1, 'OTP code is required'),
});

export const loginSchema = z.object({
  email: emailSchema,
  // Deliberately lax: legacy passwords must still be able to sign in.
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const socialLoginSchema = z
  .object({
    token: z.string().min(1, 'Provider token is required'),
    redirectUri: z.string().min(1).optional(),
    codeVerifier: z.string().min(1).optional(),
  })
  .refine(
    (data) => !data.codeVerifier || Boolean(data.redirectUri),
    {
      error: 'redirectUri is required when exchanging an authorization code',
      path: ['redirectUri'],
    },
  );

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    error: 'New password must differ from the current one',
    path: ['newPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterProfileInput = z.infer<typeof registerProfileSchema>;
export type RegisterMeasurementInput = z.infer<typeof registerMeasurementSchema>;
export type VerifyRegistrationInput = z.infer<typeof verifyRegistrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type SocialLoginInput = z.infer<typeof socialLoginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
