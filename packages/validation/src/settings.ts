import { z } from 'zod';

import { promptCategorySchema } from './enums';

export const aiPromptConfigSchema = z.object({
  promptCategory: promptCategorySchema,
  /** Empty string means "use the built-in fallback prompt". */
  prompt: z.string().trim(),
});

export const updateSettingsSchema = z.object({
  freeChatsLimit: z.coerce.number().int().min(0).optional(),
  aiPrompts: z
    .array(aiPromptConfigSchema)
    .superRefine((prompts, ctx) => {
      const seen = new Set<string>();
      for (const [index, entry] of prompts.entries()) {
        if (seen.has(entry.promptCategory)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Each prompt category can only be configured once',
            path: [index, 'promptCategory'],
          });
        }
        seen.add(entry.promptCategory);
      }
    })
    .optional(),
});

export type AiPromptConfigInput = z.infer<typeof aiPromptConfigSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
