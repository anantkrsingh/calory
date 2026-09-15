import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { LlmProvider } from '@fitness/types';
import type { LanguageModel } from 'ai';

export { LlmProvider };
export const LLM_PROVIDERS = Object.values(LlmProvider);

export const LLM_PROVIDER_LABELS: Record<LlmProvider, string> = {
  [LlmProvider.OpenAI]: 'OpenAI',
  [LlmProvider.Gemini]: 'Gemini',
};

/** Served from the admin app's public assets — see apps/admin/public/icons. */
export const LLM_PROVIDER_ICONS: Record<LlmProvider, string> = {
  [LlmProvider.OpenAI]: '/icons/openai.png',
  [LlmProvider.Gemini]: '/icons/gemini.png',
};

export const DEFAULT_MODELS: Record<LlmProvider, string> = {
  [LlmProvider.OpenAI]: 'gpt-4o-mini',
  [LlmProvider.Gemini]: 'gemini-3.6-flash',
};

/** Curated, selectable models per provider — shown in the admin model picker.
 * Not exhaustive: `AiPromptConfig.model` accepts any string, so an admin can
 * still type a newer id the AI SDK supports that isn't listed here yet. */
export const LLM_MODEL_CATALOG: Record<
  LlmProvider,
  { id: string; label: string }[]
> = {
  [LlmProvider.OpenAI]: [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
    { id: 'gpt-4.1', label: 'GPT-4.1' },
    { id: 'gpt-5-mini', label: 'GPT-5 mini' },
    { id: 'gpt-5', label: 'GPT-5' },
  ],
  [LlmProvider.Gemini]: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite' },
    { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash' },
  ],
};

export interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  model?: string;
}

export function createModel(config: LlmConfig): LanguageModel {
  const model = config.model ?? DEFAULT_MODELS[config.provider];

  if (config.provider === 'gemini') {
    const google = createGoogleGenerativeAI({
      apiKey: config.apiKey,
    });

    return google(model);
  }

  return createOpenAI({ apiKey: config.apiKey })(model);
}
