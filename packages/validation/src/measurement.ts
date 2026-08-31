import { LIMITS } from './constants';
import { z } from 'zod';

import { measurementSiteSchema } from './enums';
import {
  isoDateTimeSchema,
  paginationQuerySchema,
} from './primitives';

/** Circumferences in cm, keyed by body site. */
export const bodyMeasurementsSchema = z.partialRecord(
  measurementSiteSchema,
  z.number().min(1).max(300),
);

export const createMeasurementSchema = z
  .object({
    recordedAt: isoDateTimeSchema.optional(),
    weightKg: z
      .number()
      .min(LIMITS.bodyWeightKg.min)
      .max(LIMITS.bodyWeightKg.max)
      .optional(),
    bodyFatPercentage: z
      .number()
      .min(LIMITS.bodyFatPercentage.min)
      .max(LIMITS.bodyFatPercentage.max)
      .optional(),
    measurements: bodyMeasurementsSchema.default({}),
    photoUrls: z.array(z.url()).max(10).default([]),
    notes: z.string().trim().max(LIMITS.notes.max).optional(),
  })
  .refine(
    (data) =>
      data.weightKg !== undefined ||
      data.bodyFatPercentage !== undefined ||
      Object.keys(data.measurements).length > 0,
    { error: 'Record at least one measurement', path: ['weightKg'] },
  );

export const updateMeasurementSchema = z.object({
  recordedAt: isoDateTimeSchema.optional(),
  weightKg: z
    .number()
    .min(LIMITS.bodyWeightKg.min)
    .max(LIMITS.bodyWeightKg.max)
    .optional(),
  bodyFatPercentage: z
    .number()
    .min(LIMITS.bodyFatPercentage.min)
    .max(LIMITS.bodyFatPercentage.max)
    .optional(),
  measurements: bodyMeasurementsSchema.optional(),
  photoUrls: z.array(z.url()).max(10).optional(),
  notes: z.string().trim().max(LIMITS.notes.max).optional(),
});

export const measurementQuerySchema = paginationQuerySchema.extend({
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
});

export const measurementTrendQuerySchema = z.object({
  metric: z.union([
    z.literal('weightKg'),
    z.literal('bodyFatPercentage'),
    measurementSiteSchema,
  ]),
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
});

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
export type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>;
export type MeasurementQueryInput = z.infer<typeof measurementQuerySchema>;
export type MeasurementTrendQueryInput = z.infer<
  typeof measurementTrendQuerySchema
>;
