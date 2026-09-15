import { Global, Module, ServiceUnavailableException } from '@nestjs/common';
import { createModel } from '@fitness/ai';
import type { LlmProvider } from '@fitness/types';
import type { LanguageModel } from 'ai';

import { ENV, type Env } from '../config/env.module';

export const AI_MODEL_RESOLVER = Symbol('AI_MODEL_RESOLVER');

/** What an admin can override per AI feature — see `AiPromptConfig`. */
export interface ModelOverride {
  provider?: LlmProvider;
  model?: string;
}

/** Builds the `LanguageModel` for one AI feature, given its per-feature
 * override (if any). Returns `null` when the resolved provider has no API
 * key configured, so callers can degrade gracefully. */
export type AiModelResolver = (
  override?: ModelOverride,
) => LanguageModel | null;

export function requireModel(model: LanguageModel | null): LanguageModel {
  if (!model) {
    throw new ServiceUnavailableException(
      'AI features are unavailable: no API key configured for the selected LLM provider',
    );
  }
  return model;
}

export function makeModelResolver(env: Env): AiModelResolver {
  return (override) => {
    const provider = override?.provider ?? env.LLM_PROVIDER;
    const apiKey =
      provider === 'gemini'
        ? env.GOOGLE_GENERATIVE_AI_API_KEY
        : env.OPENAI_API_KEY;

    if (!apiKey) return null;

    // The env's LLM_MODEL override is scoped to the env's own provider — an
    // admin who picked a *different* provider for this feature gets that
    // provider's own default model, never the other provider's env override.
    const model =
      override?.model ??
      (provider === env.LLM_PROVIDER ? env.LLM_MODEL : undefined);

    return createModel({ provider, apiKey, model });
  };
}

@Global()
@Module({
  providers: [
    {
      provide: AI_MODEL_RESOLVER,
      inject: [ENV],
      useFactory: (env: Env): AiModelResolver => makeModelResolver(env),
    },
  ],
  exports: [AI_MODEL_RESOLVER],
})
export class AiModule {}
