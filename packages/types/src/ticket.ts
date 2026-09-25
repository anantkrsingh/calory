import type { Entity, Id } from './common';
import type {
  TicketStatus,
  TicketTimelineActorRole,
  TicketTimelineEventType,
} from './enums';

export interface TicketAttachment {
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format?: string;
  originalName?: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface SupportTicket extends Entity {
  userId: Id;
  userEmail?: string;
  userDisplayName?: string;
  subject: string;
  message: string;
  status: TicketStatus;
  attachments: TicketAttachment[];
  timeline: TicketTimelineEvent[];
  adminNote?: string;
  reviewedById?: Id;
  reviewedAt?: string;
}

export interface TicketTimelineEvent {
  id: string;
  type: TicketTimelineEventType;
  actorRole: TicketTimelineActorRole;
  actorId?: Id;
  actorName?: string;
  message?: string;
  fromStatus?: TicketStatus;
  toStatus?: TicketStatus;
  attachments: TicketAttachment[];
  createdAt: string;
}
