import { z } from 'zod';

import { ticketStatusSchema } from './enums';
import { paginationQuerySchema } from './primitives';

export const MAX_TICKET_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const ticketAttachmentInputSchema = z.object({
  url: z.url(),
  publicId: z.string().trim().min(1),
  resourceType: z.string().trim().min(1).default('image'),
  bytes: z.number().int().positive().max(MAX_TICKET_ATTACHMENT_BYTES),
  format: z.string().trim().min(1).optional(),
  originalName: z.string().trim().min(1).max(160).optional(),
  mimeType: z.string().trim().min(1).max(80).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
  attachments: z.array(ticketAttachmentInputSchema).max(3).default([]),
});

export const addTicketCommentSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  attachments: z.array(ticketAttachmentInputSchema).max(3).default([]),
});

export const reopenTicketSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  attachments: z.array(ticketAttachmentInputSchema).max(3).default([]),
});

export const listTicketsQuerySchema = paginationQuerySchema.extend({
  status: ticketStatusSchema.optional(),
});

export const updateTicketSchema = z.object({
  status: ticketStatusSchema.optional(),
  adminNote: z.string().trim().max(2000).optional(),
});

export type TicketAttachmentInput = z.output<typeof ticketAttachmentInputSchema>;
export type CreateTicketInput = z.output<typeof createTicketSchema>;
export type AddTicketCommentInput = z.output<typeof addTicketCommentSchema>;
export type ReopenTicketInput = z.output<typeof reopenTicketSchema>;
export type ListTicketsQueryInput = z.output<typeof listTicketsQuerySchema>;
export type UpdateTicketInput = z.output<typeof updateTicketSchema>;
