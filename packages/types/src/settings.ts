import type { CalorieConfig } from './calories';
import type { Entity } from './common';
import type { LlmProvider, PromptCategory } from './enums';

export interface AiPromptConfig {
  promptCategory: PromptCategory;
  prompt: string;
  /** Unset falls back to the server's default provider/model (the
   * LLM_PROVIDER/LLM_MODEL env vars) — same "empty means default" convention
   * as `prompt` itself. */
  provider?: LlmProvider;
  model?: string;
}

export interface AppSettings extends Entity {
  freeChatsLimit: number;
  aiPrompts: AiPromptConfig[];
  /** Admin overrides for the calorie engine. Anything unset falls back to the
   * defaults in `@fitness/types/calories`, so an empty config is valid. */
  calorieConfig?: CalorieConfig;
}
