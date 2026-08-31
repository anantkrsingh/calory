import { Global, Module } from '@nestjs/common';
import { createModel } from '@fitness/ai';
import type { LanguageModel } from 'ai';

import { ENV, type Env } from '../config/env.module';

export const AI_MODEL = Symbol('AI_MODEL');

/** Null when the selected provider has no API key, so the worker still boots. */
@Global()
@Module({
  providers: [
    {
      provide: AI_MODEL,
      inject: [ENV],
      useFactory: (env: Env): LanguageModel | null => {
        const apiKey =
          env.LLM_PROVIDER === 'gemini'
            ? env.GOOGLE_GENERATIVE_AI_API_KEY
            : env.OPENAI_API_KEY;

        if (!apiKey) return null;

        return createModel({
          provider: env.LLM_PROVIDER,
          apiKey,
          model: env.LLM_MODEL,
        });
      },
    },
  ],
  exports: [AI_MODEL],
})
export class AiModule {}
