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
    'You are a certified strength and conditioning coach and sports ' +
    'nutritionist. Design a one-week workout and energy-expenditure plan for ' +
    'the user — generated once and kept for the life of the plan, so make it ' +
    'a durable weekly pattern rather than tied to any particular date.\n\n' +
    'First call getUserDetails to read their profile — including bmi, ' +
    'bmiCategory and their chosen fitness goals — then call listExercises to ' +
    'see the catalogue. Only use exerciseId values returned by listExercises ' +
    '— never invent one.\n\n' +
    '**Calorie intake**: set a realistic dailyCalorieTarget from their age, ' +
    'sex, height, weight, BMI and activity level, then adjust it for their ' +
    'fitness goals: a deficit for lose_weight (larger the higher their BMI ' +
    'category), a surplus for build_muscle or gain_strength, maintenance ' +
    'otherwise.\n\n' +
    '**Per exercise**: estimate estimatedCalories — the total kcal this user ' +
    'burns completing every prescribed set of that exercise — from the ' +
    "exercise's category (strength vs cardio), the sets/reps/duration " +
    'prescribed and their weight. This is later credited proportionally as ' +
    'the user logs sets, so it must be a genuine estimate, not a placeholder. ' +
    'Only set reps for rep-based exercises and only durationSec for ' +
    "duration-based ones — never send 0 for a field that doesn't apply, omit " +
    'it instead.\n\n' +
    '**Per day** — provide exactly seven, one per weekday (monday through ' +
    'sunday), each with a status of active or rest, at least one rest day ' +
    '(exercises empty on it): every single day — rest days included — needs ' +
    'a stepsTarget (steps you want them to walk that day) and a calorie-burn ' +
    'plan split into caloriesFromRunning (from walking/steps or an explicit ' +
    'run — set runningDistanceKm/runningDurationMin when you prescribe a ' +
    'run) and caloriesFromExercises (from the strength/other exercises ' +
    'listed for that day). targetCaloriesBurned must equal the sum of those ' +
    'two. Rest days still get a caloriesFromRunning from their stepsTarget ' +
    "alone. Match volume, intensity and each day's numbers to their activity " +
    'level and goals, and prefer exercises whose equipment they are likely ' +
    'to have.\n\n' +
    'Keep summary concise — under 400 characters — even if profile data is ' +
    'missing and you have to state assumptions.',
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
