import type { Entity, Id, IsoDateTime } from './common';

export const NOTIFICATION_QUEUE_NAME = 'notification';

export const NotificationTargetType = {
  All: 'all',
  Users: 'users',
} as const;
export type NotificationTargetType =
  (typeof NotificationTargetType)[keyof typeof NotificationTargetType];

export const NotificationCampaignStatus = {
  Scheduled: 'scheduled',
  Sending: 'sending',
  Sent: 'sent',
  Canceled: 'canceled',
  Failed: 'failed',
} as const;
export type NotificationCampaignStatus =
  (typeof NotificationCampaignStatus)[keyof typeof NotificationCampaignStatus];

export const NotificationDeliveryStatus = {
  Pending: 'pending',
  Sent: 'sent',
  Delivered: 'delivered',
  Failed: 'failed',
} as const;
export type NotificationDeliveryStatus =
  (typeof NotificationDeliveryStatus)[keyof typeof NotificationDeliveryStatus];

/** Per-status device counts, derived from that campaign's delivery rows. */
export interface NotificationDeliveryCounts {
  pending: number;
  sent: number;
  delivered: number;
  failed: number;
}

export interface NotificationCampaign extends Entity {
  title: string;
  body: string;
  targetType: NotificationTargetType;
  /** Only present (and meaningful) when `targetType` is `users`. */
  targetUserIds?: Id[];
  status: NotificationCampaignStatus;
  /** Unset means it was (or will be) sent immediately. */
  scheduledAt?: IsoDateTime;
  sentAt?: IsoDateTime;
  error?: string;
  /** Devices attempted — one user can hold several push tokens. */
  recipientCount: number;
  createdByEmail: string;
  counts: NotificationDeliveryCounts;
}

export interface NotificationDelivery extends Entity {
  campaignId: Id;
  userId: Id;
  userEmail: string;
  userDisplayName: string;
  pushToken: string;
  status: NotificationDeliveryStatus;
  errorCode?: string;
  errorMessage?: string;
  sentAt?: IsoDateTime;
  deliveredAt?: IsoDateTime;
  failedAt?: IsoDateTime;
}

export interface NotificationJobData {
  campaignId: Id;
}

export interface NotificationJobResult {
  campaignId: Id;
  recipientCount: number;
}
