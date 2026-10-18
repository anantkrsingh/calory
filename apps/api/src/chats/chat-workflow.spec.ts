import {
  buildChatWorkflow,
  buildUserProfileContext,
  deterministicChatCategorization,
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
