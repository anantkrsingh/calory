import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

export interface GeminiOptions {
  apiKey: string;
  model?: string;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export function gemini(options: GeminiOptions): LanguageModel {
  const provider = createGoogleGenerativeAI({ apiKey: options.apiKey });
  return provider(options.model ?? DEFAULT_GEMINI_MODEL);
}
