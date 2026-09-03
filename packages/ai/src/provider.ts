import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

export const LLM_PROVIDERS = ['openai', 'gemini'] as const;
export type LlmProvider = (typeof LLM_PROVIDERS)[number];

export const DEFAULT_MODELS: Record<LlmProvider, string> = {
  openai: 'gpt-4.1-mini',
  gemini: 'gemini-2.5-flash',
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
