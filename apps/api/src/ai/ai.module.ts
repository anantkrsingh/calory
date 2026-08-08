import { Global, Module, ServiceUnavailableException } from '@nestjs/common';
import type { Env } from '@fitness/config/server';
import { gemini } from '@fitness/ai';
import type { LanguageModel } from 'ai';

import { ENV } from '../config/env.module';

export const AI_MODEL = Symbol('AI_MODEL');

export function requireModel(model: LanguageModel | null): LanguageModel {
  if (!model) {
    throw new ServiceUnavailableException(
      'AI features are unavailable: GOOGLE_GENERATIVE_AI_API_KEY is not set',
    );
  }
  return model;
}

@Global()
@Module({
  providers: [
    {
      provide: AI_MODEL,
      inject: [ENV],
      useFactory: (env: Env): LanguageModel | null =>
        env.GOOGLE_GENERATIVE_AI_API_KEY
          ? gemini({
              apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
              model: env.GEMINI_MODEL,
            })
          : null,
    },
  ],
  exports: [AI_MODEL],
})
export class AiModule {}
