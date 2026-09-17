import { Global, Module } from '@nestjs/common';
import { createModel, createWebSearchTool } from '@fitness/ai';
import type { LlmProvider } from '@fitness/types';
import type { LanguageModel } from 'ai';

import { ENV, type Env } from '../config/env.module';

export const AI_MODEL_RESOLVER = Symbol('AI_MODEL_RESOLVER');
export const AI_SEARCH_TOOL_RESOLVER = Symbol('AI_SEARCH_TOOL_RESOLVER');

/** What an admin can override per AI feature — see `AiPromptConfig`. */
export interface ModelOverride {
  provider?: LlmProvider;
  model?: string;
}

/** Builds the `LanguageModel` for one AI feature, given its per-feature
 * override (if any). Returns `null` when the resolved provider has no API
 * key configured, so callers can degrade gracefully (a processor still boots
 * and just skips the job rather than crashing). */
export type AiModelResolver = (
  override?: ModelOverride,
) => LanguageModel | null;

/** Google Search grounding tool for one AI feature, given its per-feature
 * override. `undefined` when the resolved provider has no search grounding
 * (or no API key) — callers should skip citations for that turn rather than
 * ask the model to invent sources. */
export type AiSearchToolResolver = (
  override?: ModelOverride,
) => ReturnType<typeof createWebSearchTool>;

function resolveProviderAndKey(
  env: Env,
  override?: ModelOverride,
): { provider: LlmProvider; apiKey: string | undefined } {
  const provider = override?.provider ?? env.LLM_PROVIDER;
  const apiKey =
    provider === 'gemini'
      ? env.GOOGLE_GENERATIVE_AI_API_KEY
      : env.OPENAI_API_KEY;
  return { provider, apiKey };
}

export function makeModelResolver(env: Env): AiModelResolver {
  return (override) => {
    const { provider, apiKey } = resolveProviderAndKey(env, override);
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

export function makeSearchToolResolver(env: Env): AiSearchToolResolver {
  return (override) => {
    const { provider, apiKey } = resolveProviderAndKey(env, override);
    if (!apiKey) return undefined;
    return createWebSearchTool({ provider, apiKey });
  };
}

/** Null when the selected provider has no API key, so the worker still boots. */
@Global()
@Module({
  providers: [
    {
      provide: AI_MODEL_RESOLVER,
      inject: [ENV],
      useFactory: (env: Env): AiModelResolver => makeModelResolver(env),
    },
    {
      provide: AI_SEARCH_TOOL_RESOLVER,
      inject: [ENV],
      useFactory: (env: Env): AiSearchToolResolver =>
        makeSearchToolResolver(env),
    },
  ],
  exports: [AI_MODEL_RESOLVER, AI_SEARCH_TOOL_RESOLVER],
})
export class AiModule {}
