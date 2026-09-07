import type { CalorieConfig } from './calories';
import type { Entity } from './common';
import type { PromptCategory } from './enums';

export interface AiPromptConfig {
  promptCategory: PromptCategory;
  prompt: string;
}

export interface AppSettings extends Entity {
  freeChatsLimit: number;
  aiPrompts: AiPromptConfig[];
  /** Admin overrides for the calorie engine. Anything unset falls back to the
   * defaults in `@fitness/types/calories`, so an empty config is valid. */
  calorieConfig?: CalorieConfig;
}
