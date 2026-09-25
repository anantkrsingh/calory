import type { Citation } from '@fitness/types';
import { z } from 'zod';

import { retrieveBlogEvidence } from './fit-crate-kb';

export type ChatIntent =
  | 'personalized_plan'
  | 'personalized_info'
  | 'personalized_edit'
  | 'information_evidence'
  | 'information_plain'
  | 'general';

export type ChatWorkflowState =
  | 'needs_profile_input'
  | 'ready_for_personalized_answer'
  | 'ready_for_plain_answer'
  | 'ready_with_kb_evidence'
  | 'general_reply';

export interface ChatProfileSnapshot {
  ageYears: number | null;
  sex: string | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: string | null;
  fitnessGoals: string[];
  dietTypes: string[];
  dietCuisine: string | null;
  dietExclusions: string[];
  mealsPerDay: number | null;
}

export interface FitCrateEvidence {
  id: string;
  title: string;
  url: string;
  topics: string[];
  summary: string;
}

export interface ChatWorkflow {
  intent: ChatIntent;
  state: ChatWorkflowState;
  requiresDietPreferences: boolean;
  missingProfileFields: string[];
  evidence: FitCrateEvidence[];
  citations: Citation[];
}

export type ChatPromptCategory =
  | 'greeting'
  | 'normal'
  | 'fitness_evidence'
  | 'personal_data'
  | 'plan_or_edit'
  | 'unsafe';

export interface ChatCategorization {
  safe: boolean;
  citationsRequired: boolean;
  category: ChatPromptCategory;
  reason?: string;
}

const PLAN_RE =
  /\b(plan|routine|diet|meal|workout|weight loss|fat loss|goal|program)\b/i;
const DIET_PLAN_RE =
  /\b(diet|meal|meals|food|nutrition|calorie|calories|macro|macros|weight loss|fat loss)\b/i;
const EDIT_RE = /\b(change|edit|replace|swap|update|remove|add|regenerate)\b/i;
const PERSONAL_RE = /\b(my|me|for me|i want|create me|make me|plan for)\b/i;
const PLAN_COMMAND_RE = /\b(create|generate|build|make)\b/i;
const INFO_RE =
  /\b(what|why|how|when|should|am|is|are|tell|show|list|explain|benefit|safe)\b/i;
const EVIDENCE_RE =
  /\b(nutrition|diet|meal|protein|calorie|macro|health|injury|recovery|supplement|weight|bmi|body fat|weight loss|fat loss|workout|fitness|exercise|history|reps|shoulder|muscle|build|buld)\b/i;
const PERSONAL_MEASUREMENT_RE =
  /\b(weight|overweight|underweight|bmi|body fat|calorie|calories|macro|macros|diet|meal|nutrition)\b/i;
const DIET_TYPE_RE = /\b(vegan|vegetarian|veg|non[-\s]?veg|nonvegetarian)\b/i;
const MEALS_PER_DAY_RE = /\b[2-6]\s*(meals?|times?)\b/i;
const GREETING_RE =
  /^\s*(hi|hello|hey|yo|thanks|thank you|ok|okay|cool|nice|great|yes|no|yep|nope)[\s!.?]*$/i;
const NORMAL_SMALL_TALK_RE =
  /\b(how are you|who are you|what can you do|help me use|open|navigate|screen|settings)\b/i;
const UNSAFE_RE =
  /\b(self[-\s]?harm|suicide|kill myself|starve|purge|vomit|laxative|anabolic steroid|steroids?|dnp|clenbuterol|crash diet|water cut|rapid weight loss|medical emergency|chest pain|illegal drug|hack|weapon)\b/i;

export function routeChatIntent(content: string): ChatIntent {
  if (
    (PERSONAL_RE.test(content) || PLAN_COMMAND_RE.test(content)) &&
    PLAN_RE.test(content)
  ) {
    return EDIT_RE.test(content) ? 'personalized_edit' : 'personalized_plan';
  }
  if (
    PERSONAL_RE.test(content) &&
    INFO_RE.test(content) &&
    EVIDENCE_RE.test(content)
  ) {
    return 'personalized_info';
  }
  if (INFO_RE.test(content) && EVIDENCE_RE.test(content)) {
    return 'information_evidence';
  }
  if (INFO_RE.test(content)) return 'information_plain';
  return 'general';
}

export function validateProfileForIntent(
  intent: ChatIntent,
  profile: ChatProfileSnapshot,
  content: string,
): string[] {
  if (intent === 'personalized_info') {
    return PERSONAL_MEASUREMENT_RE.test(content) && !profile.heightCm
      ? ['height']
      : [];
  }

  if (intent !== 'personalized_plan' && intent !== 'personalized_edit') {
    return [];
  }

  const missing: string[] = [];
  if (!profile.sex) missing.push('sex');
  if (!profile.ageYears) missing.push('dateOfBirth');
  if (!profile.heightCm) missing.push('height');
  if (!profile.weightKg) missing.push('weight');
  if (!profile.activityLevel) missing.push('activityLevel');
  if (profile.fitnessGoals.length === 0) missing.push('fitnessGoals');
  if (requiresDietPreferences(content)) {
    if (profile.dietTypes.length === 0 && !DIET_TYPE_RE.test(content)) {
      missing.push('dietTypes');
    }
    if (!profile.mealsPerDay && !MEALS_PER_DAY_RE.test(content)) {
      missing.push('mealsPerDay');
    }
  }
  return missing;
}

export function requiresDietPreferences(content: string): boolean {
  return DIET_PLAN_RE.test(content);
}

export function retrieveFitCrateEvidence(
  intent: ChatIntent,
  content: string,
): FitCrateEvidence[] {
  if (
    intent !== 'information_evidence' &&
    intent !== 'personalized_info' &&
    intent !== 'personalized_plan' &&
    intent !== 'personalized_edit'
  ) {
    return [];
  }

  return retrieveBlogEvidence(content);
}

export function mapVerifiedCitations(evidence: FitCrateEvidence[]): Citation[] {
  return evidence.map(({ title, url }) => ({ title, url }));
}

export function buildChatWorkflow(
  content: string,
  profile: ChatProfileSnapshot,
): ChatWorkflow {
  const intent = routeChatIntent(content);
  const needsDietPreferences =
    (intent === 'personalized_plan' || intent === 'personalized_edit') &&
    requiresDietPreferences(content);
  const missingProfileFields = validateProfileForIntent(
    intent,
    profile,
    content,
  );
  const evidence = retrieveFitCrateEvidence(intent, content);
  const citations = mapVerifiedCitations(evidence);

  const state: ChatWorkflowState =
    missingProfileFields.length > 0
      ? 'needs_profile_input'
      : intent === 'personalized_plan' ||
          intent === 'personalized_edit' ||
          intent === 'personalized_info'
        ? 'ready_for_personalized_answer'
        : intent === 'information_evidence'
          ? evidence.length > 0
            ? 'ready_with_kb_evidence'
            : 'ready_for_plain_answer'
          : intent === 'information_plain'
            ? 'ready_for_plain_answer'
            : 'general_reply';

  return {
    intent,
    state,
    requiresDietPreferences: needsDietPreferences,
    missingProfileFields,
    evidence,
    citations,
  };
}

export const chatCategorizationSchema = z.object({
  safe: z.boolean(),
  citationsRequired: z.boolean(),
  category: z.enum([
    'greeting',
    'normal',
    'fitness_evidence',
    'personal_data',
    'plan_or_edit',
    'unsafe',
  ]),
  reason: z.string().max(200).optional(),
});

export function deterministicChatCategorization(
  content: string,
  workflow: ChatWorkflow,
): ChatCategorization {
  if (UNSAFE_RE.test(content)) {
    return {
      safe: false,
      citationsRequired: false,
      category: 'unsafe',
      reason: 'Potentially unsafe request.',
    };
  }

  if (GREETING_RE.test(content)) {
    return {
      safe: true,
      citationsRequired: false,
      category: 'greeting',
      reason: 'Greeting or acknowledgement.',
    };
  }

  if (
    workflow.intent === 'general' ||
    (workflow.intent === 'information_plain' &&
      NORMAL_SMALL_TALK_RE.test(content) &&
      !EVIDENCE_RE.test(content))
  ) {
    return {
      safe: true,
      citationsRequired: false,
      category: 'normal',
      reason: 'Normal chat or app-navigation question.',
    };
  }

  const category: ChatPromptCategory =
    workflow.intent === 'personalized_plan' ||
    workflow.intent === 'personalized_edit'
      ? 'plan_or_edit'
      : workflow.intent === 'personalized_info'
        ? 'personal_data'
        : 'fitness_evidence';

  return {
    safe: true,
    citationsRequired: true,
    category,
    reason: 'Fitness, nutrition, body-weight, workout, or progress topic.',
  };
}

export function buildChatCategorizationPrompt(
  content: string,
  workflow: ChatWorkflow,
): string {
  return JSON.stringify({
    userMessage: content,
    deterministicFallback: deterministicChatCategorization(content, workflow),
    workflow,
    rules: [
      'Return safe=false only for clearly unsafe or disallowed requests.',
      'Return citationsRequired=false only for greetings, thanks, acknowledgements, simple app navigation, or ordinary small talk.',
      'Return citationsRequired=true for body weight, BMI, diet, calories, supplements, workouts, exercise history, reps history, progress, recovery, injury, or plan generation.',
      'Do not mark a safe health or fitness question unsafe just because it mentions weight, BMI, or weight loss.',
    ],
  });
}

export const chatWorkflowPlanSchema = z.object({
  workflowState: z.enum([
    'needs_profile_input',
    'ready_for_personalized_answer',
    'ready_for_plain_answer',
    'ready_with_kb_evidence',
    'general_reply',
  ]),
  responseMode: z.enum(['ask_profile_question', 'answer', 'edit_or_generate']),
  requiredToolNames: z.array(z.string()).max(4).default([]),
  assumptions: z.array(z.string()).max(3).default([]),
  answerOutline: z.array(z.string()).min(1).max(5),
});

export type ChatWorkflowPlan = z.infer<typeof chatWorkflowPlanSchema>;

export function buildWorkflowPlannerPrompt(
  content: string,
  workflow: ChatWorkflow,
  categorization: ChatCategorization,
): string {
  return JSON.stringify({
    userMessage: content,
    workflow,
    categorization,
    rules: [
      'Do not add citations or urls.',
      'If categorization.safe is false, plan a brief refusal and no write tools.',
      'If state is needs_profile_input, ask for one missing field only.',
      'For missing dietTypes ask veg, non-veg, vegan, or mixed veg/non-veg.',
      'For missing mealsPerDay ask how many meals per day, 2 to 6.',
      'Prefer short answers and low tool use.',
    ],
  });
}

export function buildFinalWorkflowInstruction(
  workflow: ChatWorkflow,
  categorization: ChatCategorization,
  plan: ChatWorkflowPlan,
  content: string,
): string {
  return JSON.stringify({
    workflow,
    categorization,
    plan,
    citationsAllowed: workflow.citations.length,
    rules: [
      'If categorization.safe is false, briefly refuse, avoid tool calls, and offer a safer fitness alternative.',
      'Answer only fitness, nutrition, recovery, healthy habit, and app-data parts.',
      'Briefly decline unrelated parts such as programming or school/work tasks.',
      'If categorization.citationsRequired is true, answer with the attached verified citations in mind; do not invent URLs.',
      'Use getUserDetails before answering personal weight, BMI, calorie, diet, or routine questions.',
      'Use getWorkoutHistory before answering exercise history, reps history, workout progress, or logged-set questions.',
      'For diet-plan generation, make sure BMI inputs and diet preferences are known before using regenerateDietPlan.',
      'For diet-plan generation, ask for confirmation before saving: "Should I update this in your Diets list?"',
      'Only call regenerateDietPlan when the latest user reply clearly confirms saving the plan.',
    ],
    userMessage: content,
  });
}
