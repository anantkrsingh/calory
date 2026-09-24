import type { Citation } from '@fitness/types';
import { z } from 'zod';

export type ChatIntent =
  | 'personalized_plan'
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
  missingProfileFields: string[];
  evidence: FitCrateEvidence[];
  citations: Citation[];
}

const PLAN_RE =
  /\b(plan|routine|diet|meal|workout|weight loss|fat loss|goal|program)\b/i;
const EDIT_RE = /\b(change|edit|replace|swap|update|remove|add|regenerate)\b/i;
const PERSONAL_RE = /\b(my|me|for me|i want|create me|make me|plan for)\b/i;
const INFO_RE = /\b(what|why|how|when|should|is|are|explain|benefit|safe)\b/i;
const EVIDENCE_RE =
  /\b(nutrition|diet|meal|protein|calorie|macro|health|injury|recovery|supplement|weight loss|fat loss|workout|fitness)\b/i;

export function routeChatIntent(content: string): ChatIntent {
  if (PERSONAL_RE.test(content) && PLAN_RE.test(content)) {
    return EDIT_RE.test(content) ? 'personalized_edit' : 'personalized_plan';
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
): string[] {
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
  return missing;
}

export function retrieveFitCrateEvidence(
  intent: ChatIntent,
): FitCrateEvidence[] {
  if (intent !== 'information_evidence') return [];

  // Fit Crate KB/blog retrieval plugs in here. Until those curated pages
  // exist, the verified evidence set is intentionally empty.
  return [];
}

export function mapVerifiedCitations(evidence: FitCrateEvidence[]): Citation[] {
  return evidence.map(({ title, url }) => ({ title, url }));
}

export function buildChatWorkflow(
  content: string,
  profile: ChatProfileSnapshot,
): ChatWorkflow {
  const intent = routeChatIntent(content);
  const missingProfileFields = validateProfileForIntent(intent, profile);
  const evidence = retrieveFitCrateEvidence(intent);
  const citations = mapVerifiedCitations(evidence);

  const state: ChatWorkflowState =
    missingProfileFields.length > 0
      ? 'needs_profile_input'
      : intent === 'personalized_plan' || intent === 'personalized_edit'
        ? 'ready_for_personalized_answer'
        : intent === 'information_evidence'
          ? evidence.length > 0
            ? 'ready_with_kb_evidence'
            : 'ready_for_plain_answer'
          : intent === 'information_plain'
            ? 'ready_for_plain_answer'
            : 'general_reply';

  return { intent, state, missingProfileFields, evidence, citations };
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
): string {
  return JSON.stringify({
    userMessage: content,
    workflow,
    rules: [
      'Do not add citations or urls.',
      'If state is needs_profile_input, ask for one missing field only.',
      'Prefer short answers and low tool use.',
    ],
  });
}

export function buildFinalWorkflowInstruction(
  workflow: ChatWorkflow,
  plan: ChatWorkflowPlan,
  content: string,
): string {
  return JSON.stringify({
    workflow,
    plan,
    citationsAllowed: workflow.citations.length,
    userMessage: content,
  });
}
