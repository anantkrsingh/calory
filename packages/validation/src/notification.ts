import { LIMITS } from './constants';
import { z } from 'zod';

import {
  notificationCampaignStatusSchema,
  notificationDeliveryStatusSchema,
  notificationTargetTypeSchema,
} from './enums';
import {
  isoDateTimeSchema,
  objectIdSchema,
  paginationQuerySchema,
} from './primitives';

export const createNotificationCampaignSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(LIMITS.notificationTitle.min)
      .max(LIMITS.notificationTitle.max),
    body: z
      .string()
      .trim()
      .min(LIMITS.notificationBody.min)
      .max(LIMITS.notificationBody.max),
    targetType: notificationTargetTypeSchema,
    targetUserIds: z
      .array(objectIdSchema)
      .min(LIMITS.notificationTargetUsers.min)
      .max(LIMITS.notificationTargetUsers.max)
      .optional(),
    // Absent or omitted means "send now". Zod validates the format here;
    // the service is what rejects a timestamp already in the past, since
    // that needs a comparison against the request-time clock, not the shape.
    scheduledAt: isoDateTimeSchema.optional(),
  })
  .refine(
    (data) =>
      data.targetType !== 'users' ||
      (data.targetUserIds?.length ?? 0) > 0,
    {
      error: 'Pick at least one recipient',
      path: ['targetUserIds'],
    },
  );

export const listNotificationCampaignsQuerySchema = paginationQuerySchema.extend({
  status: notificationCampaignStatusSchema.optional(),
});

export const listNotificationDeliveriesQuerySchema = paginationQuerySchema.extend(
  {
    status: notificationDeliveryStatusSchema.optional(),
  },
);

export type CreateNotificationCampaignInput = z.infer<
  typeof createNotificationCampaignSchema
>;
export type ListNotificationCampaignsQueryInput = z.infer<
  typeof listNotificationCampaignsQuerySchema
>;
export type ListNotificationDeliveriesQueryInput = z.infer<
  typeof listNotificationDeliveriesQuerySchema
>;
