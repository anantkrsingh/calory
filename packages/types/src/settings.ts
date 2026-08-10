import type { Entity } from './common';

export interface AiPromptConfig {
  key: string;
  label: string;
  prompt: string;
}

export interface AppSettings extends Entity {
  freeChatsLimit: number;
  aiPrompts: AiPromptConfig[];
}
