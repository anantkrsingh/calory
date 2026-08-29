import { PromptCategory } from '@fitness/types';

export const PROMPT_CATEGORIES = Object.values(PromptCategory);

export const PROMPT_CATEGORY_LABELS: Record<PromptCategory, string> = {
  [PromptCategory.QuoteOfTheDay]: 'Quote of the day',
  [PromptCategory.WorkoutRoutine]: 'Workout routine',
  [PromptCategory.UserChat]: 'User chat',
};

/** Built-in fallbacks used when no DB prompt is configured for a category. */
export const DEFAULT_PROMPTS: Record<PromptCategory, string> = {
  [PromptCategory.QuoteOfTheDay]:
    'Write one short, original motivational quote for a fitness app to show ' +
    'as the quote of the day. Keep it under 50 characters, uplifting and ' +
    'specific to training or discipline. Do not use quotation marks, hashtags ' +
    'or attributions.',
  [PromptCategory.WorkoutRoutine]:
    'You are a certified strength and conditioning coach. Design a one-week ' +
    'workout routine for the user.\n\n' +
    'First call getUserDetails to read their profile, then call listExercises ' +
    'to see the catalogue. Only use exerciseId values returned by ' +
    'listExercises — never invent one.\n\n' +
    'Set a realistic dailyCalorieTarget from their age, sex, height, weight ' +
    'and activity level. Provide exactly seven days (dayOfWeek 1 = Monday ' +
    'through 7 = Sunday) including at least one rest day. On a rest day set ' +
    'isRestDay true and leave exercises empty. Match volume and intensity to ' +
    'their activity level, and prefer exercises whose equipment they are ' +
    'likely to have.',
  [PromptCategory.UserChat]:
    'You are a supportive fitness coach inside a training app. Answer the ' +
    "user's questions about workouts, recovery, nutrition basics, form cues, " +
    'and motivation.\n\n' +
    'Keep replies concise and actionable. Prefer clear bullet points over ' +
    'long essays. Do not diagnose medical conditions or prescribe medication; ' +
    'suggest seeing a qualified professional when health risks are involved. ' +
    'If you lack the user\'s profile details, ask one clarifying question ' +
    'instead of inventing numbers.',
};

/** Admin-configured prompt for `category`, falling back to the built-in default. */
export function resolvePrompt(
  category: PromptCategory,
  configured: { promptCategory: string; prompt: string }[] | undefined,
): string {
  const match = configured?.find((entry) => entry.promptCategory === category);
  return match?.prompt?.trim() || DEFAULT_PROMPTS[category];
}
