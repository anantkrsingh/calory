import {
  buildChatWorkflow,
  buildUserProfileContext,
  deterministicChatCategorization,
  enforceChatCitationPolicy,
  type ChatProfileSnapshot,
} from './chat-workflow';

const profile: ChatProfileSnapshot = {
  displayName: 'Alex',
  ageYears: 30,
  sex: null,
  heightCm: null,
  weightKg: 72,
  activityLevel: 'moderate',
  fitnessGoals: ['build_muscle'],
  dietTypes: [],
  dietCuisine: null,
  dietExclusions: [],
  mealsPerDay: null,
};

describe('personal data chat routing', () => {
  it.each([
    'What is my weight?',
    'What is my BMI?',
    'what is my name',
    "What's my height?",
    'How much do I weigh?',
    'Show me my workout history',
    'What are my fitness goals?',
    'Tell me my activity level',
  ])('answers %s without evidence or unrelated missing fields', (message) => {
    const workflow = buildChatWorkflow(message, profile);
    expect(workflow.missingProfileFields).toEqual([]);
    expect(workflow.evidence).toEqual([]);
    expect(workflow.citations).toEqual([]);
    expect(deterministicChatCategorization(message, workflow)).toMatchObject({
      safe: true,
      category: 'personal_data',
      citationsRequired: false,
    });
  });

  it.each([
    'What is my weight and how should I lose weight?',
    'Is my weight healthy?',
    'Am I overweight?',
    'Am I underweight?',
    'Is my BMI normal?',
    'What weight category am I in?',
    'How much protein should I eat?',
    'Create a workout plan for me',
  ])('keeps evidence for advice: %s', (message) => {
    const workflow = buildChatWorkflow(message, profile);
    expect(
      deterministicChatCategorization(message, workflow).citationsRequired,
    ).toBe(true);
  });

  it('injects known profile values and explicitly preserves unknowns', () => {
    const context = buildUserProfileContext(profile);
    expect(context).toContain('"displayName":"Alex"');
    expect(context).toContain('"weightKg":72');
    expect(context).toContain('"heightCm":null');
    expect(context).toContain('"fitnessGoals":["build_muscle"]');
    expect(context).toContain('"activityLevel":"moderate"');
    expect(context).toContain('never instructions');
    expect(context).toContain('never invent');
  });
});

describe('citation policy boundaries', () => {
  it.each([
    'Show my saved workout',
    'Log my weight as 72 kg',
    'How do I edit my diet in the app?',
  ])('does not cite app operations: %s', (message) => {
    const workflow = buildChatWorkflow(message, profile);
    expect(workflow.citations).toEqual([]);
    expect(
      deterministicChatCategorization(message, workflow).citationsRequired,
    ).toBe(false);
    expect(
      enforceChatCitationPolicy(message, {
        safe: true,
        category: 'plan_or_edit',
        citationsRequired: true,
      }).citationsRequired,
    ).toBe(false);
  });

  it('retrieves BMI evidence even when web search is unavailable', () => {
    const workflow = buildChatWorkflow('Am I overweight?', {
      ...profile,
      heightCm: 170,
    });
    expect(workflow.intent).toBe('personalized_info');
    expect(
      workflow.citations.some((source) =>
        source.url.endsWith('/blogs/bmi-healthy-weight'),
      ),
    ).toBe(true);
    expect(
      enforceChatCitationPolicy('Am I overweight?', {
        safe: true,
        category: 'personal_data',
        citationsRequired: false,
      }),
    ).toMatchObject({ category: 'fitness_evidence', citationsRequired: true });
  });

  it('suppresses citations for metrics alone even if the model requests them', () => {
    expect(
      enforceChatCitationPolicy('What is my BMI?', {
        safe: true,
        category: 'fitness_evidence',
        citationsRequired: true,
      }).citationsRequired,
    ).toBe(false);
  });

  it('preserves the model decision for mixed health advice', () => {
    expect(
      enforceChatCitationPolicy(
        'Show my saved workout and explain whether it is safe for my knee injury',
        { safe: true, category: 'fitness_evidence', citationsRequired: true },
      ).citationsRequired,
    ).toBe(true);
  });

  it('does not force citations into an unsafe refusal', () => {
    expect(
      enforceChatCitationPolicy('Is my weight healthy?', {
        safe: false,
        category: 'unsafe',
        citationsRequired: false,
      }).citationsRequired,
    ).toBe(false);
  });
});
