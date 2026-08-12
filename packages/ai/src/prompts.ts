export const PROMPT_KEYS = ['quoteOfTheDay', 'workoutRoutine'] as const;
export type PromptKey = (typeof PROMPT_KEYS)[number];

export const DEFAULT_PROMPTS: Record<PromptKey, string> = {
  quoteOfTheDay:
    'Write one short, original motivational quote for a fitness app to show ' +
    'as the quote of the day. Keep it under 140 characters, uplifting and ' +
    'specific to training or discipline. Do not use quotation marks, hashtags ' +
    'or attributions.',
  workoutRoutine:
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
};

/** Admin-configured prompt for `key`, falling back to the built-in default. */
export function resolvePrompt(
  key: PromptKey,
  configured: { key: string; prompt: string }[] | undefined,
): string {
  const match = configured?.find((entry) => entry.key === key);
  return match?.prompt?.trim() || DEFAULT_PROMPTS[key];
}
