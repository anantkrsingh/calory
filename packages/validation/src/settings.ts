import { z } from 'zod';

export const aiPromptConfigSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
});

export const updateSettingsSchema = z.object({
  freeChatsLimit: z.coerce.number().int().min(0).optional(),
  aiPrompts: z.array(aiPromptConfigSchema).optional(),
});

export type AiPromptConfigInput = z.infer<typeof aiPromptConfigSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
