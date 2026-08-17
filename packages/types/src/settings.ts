import type { Entity } from './common';
import type { PromptCategory } from './enums';

export interface AiPromptConfig {
  promptCategory: PromptCategory;
  prompt: string;
}

export interface AppSettings extends Entity {
  freeChatsLimit: number;
  aiPrompts: AiPromptConfig[];
}
