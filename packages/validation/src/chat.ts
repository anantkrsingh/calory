import { LIMITS } from '@fitness/config';
import { z } from 'zod';

import { objectIdSchema, paginationQuerySchema } from './primitives';

export const createChatSchema = z.object({
  title: z
    .string()
    .trim()
    .min(LIMITS.chatTitle.min)
    .max(LIMITS.chatTitle.max)
    .optional(),
});

export const updateChatSchema = z.object({
  title: z
    .string()
    .trim()
    .min(LIMITS.chatTitle.min)
    .max(LIMITS.chatTitle.max),
});

export const sendChatMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(LIMITS.chatMessage.min)
    .max(LIMITS.chatMessage.max),
});

export const chatQuerySchema = paginationQuerySchema;

export const chatMessageQuerySchema = paginationQuerySchema;

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type UpdateChatInput = z.infer<typeof updateChatSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
/** page/limit optional — server zod pipe applies defaults. */
export type ChatQueryInput = Partial<z.output<typeof chatQuerySchema>>;
export type ChatMessageQueryInput = Partial<
  z.output<typeof chatMessageQuerySchema>
>;
