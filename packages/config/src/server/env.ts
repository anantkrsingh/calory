import { z } from 'zod';

import { API_PREFIX, PAGINATION } from '../constants';

/**
 * Server-side environment contract. Importing this module from the Expo app is a
 * mistake — it reads `process.env` and is only reachable via `@fitness/config/server`.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_PREFIX: z.string().min(1).default(API_PREFIX),
  CORS_ORIGIN: z.string().default('*'),

  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .refine(
      (value) =>
        value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
      'MONGODB_URI must start with mongodb:// or mongodb+srv://',
    ),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  // `ms`-style duration, e.g. 15m / 7d / 3600. Validated here so the API can
  // hand it to jsonwebtoken without re-checking the format.
  JWT_EXPIRES_IN: z
    .string()
    .regex(
      /^\d+(\.\d+)?\s*(ms|s|m|h|d|w|y)?$/i,
      'JWT_EXPIRES_IN must be a duration like 15m, 7d, or a number of seconds',
    )
    .default('7d'),

  SWAGGER_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  GOOGLE_CLIENT_IDS: z
    .string()
    .optional()
    .describe('Comma-separated OAuth client ids accepted as ID token audiences'),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  X_CLIENT_ID: z.string().optional(),
  X_CLIENT_SECRET: z.string().optional(),

  LLM_PROVIDER: z.enum(['openai', 'gemini']).default('openai'),
  /** Overrides the provider's default model when set. */
  LLM_MODEL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),

  QUOTE_CRON: z.string().default('0 3 * * *'),
  QUOTE_TIMEZONE: z.string().default('UTC'),

  // Backfills a daily plan for any user missing one (new deploys, prior
  // registrations, or a routine stuck in `failed`).
  ROUTINE_RECONCILE_CRON: z.string().default('*/30 * * * *'),

  DEFAULT_PAGE_SIZE: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.maxLimit)
    .default(PAGINATION.defaultLimit),

  // BullMQ / Redis configuration for background jobs
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  
  // OTP configuration
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(4),

  // SMTP configuration for sending OTP emails via nodemailer
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required').default('localhost'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().min(1).default('no-reply@fitness.app'),

  // Cloudinary — required for image uploads; leave blank to disable uploads.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parses and validates environment variables, failing fast with every problem
 * listed at once rather than one crash per missing key.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return result.data;
}

export const isProduction = (env: Env): boolean => env.NODE_ENV === 'production';
export const isTest = (env: Env): boolean => env.NODE_ENV === 'test';
