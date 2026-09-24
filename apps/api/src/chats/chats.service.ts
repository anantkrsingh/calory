import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  paginate,
  toCalorieConfig,
  toChatConversation,
  toChatMessage,
  toSkipTake,
  type ChatConversationRow,
} from '@fitness/db';
import { resolveModelConfig, resolvePrompt } from '@fitness/ai';
import type {
  AskQuestionPayload,
  ChatConversation,
  ChatConversationDetail,
  ChatMessage,
  Id,
  Paginated,
} from '@fitness/types';
import {
  ASK_QUESTION_MARKER,
  ChatMessageRole,
  PromptCategory,
  bmiCategory,
  calculateBmi,
  energyProfile,
  yearsSince,
} from '@fitness/types';
import {
  dayOfWeekSchema,
  dietCuisineSchema,
  dietTypeSchema,
  equipmentSchema,
  exerciseQuerySchema,
  generateDietPlanSchema,
  muscleGroupSchema,
  routineDayStatusSchema,
  type ChatMessageQueryInput,
  type ChatQueryInput,
  type CreateChatInput,
  type GenerateDietPlanInput,
  type SendChatMessageInput,
  type UpdateChatInput,
} from '@fitness/validation';
import {
  generateObject,
  stepCountIs,
  streamText,
  tool,
  type LanguageModel,
} from 'ai';
import { z } from 'zod';

import {
  AI_MODEL_RESOLVER,
  requireModel,
  type AiModelResolver,
} from '../ai/ai.module';
import { LIMITS } from '../config/constants';
import { DietPlansService } from '../diets/diet-plans.service';
import { ExercisesService } from '../exercises/exercises.service';
import { PrismaService } from '../prisma/prisma.service';
import { WorkoutRoutineService } from '../routines/workout-routine.service';
import {
  buildChatWorkflow,
  buildFinalWorkflowInstruction,
  buildWorkflowPlannerPrompt,
  chatWorkflowPlanSchema,
  type ChatProfileSnapshot,
  type ChatWorkflow,
  type ChatWorkflowPlan,
} from './chat-workflow';

const TITLE_MAX = LIMITS.chatTitle.max;
const ASK_QUESTION_TOOL = 'askQuestion';
// getUserDetails/getCurrentRoutine/getCurrentDietPlan/listExercises, an edit
// (routine or diet), then (optionally) askQuestion or a final answer.
const MAX_AGENT_STEPS = 10;
const DIET_SAVE_CONFIRM_RE =
  /\b(yes|yeah|yep|ok|okay|confirm|confirmed|do it|go ahead|looks good|save it|save this|update it)\b/i;
const DIET_SAVE_DECLINE_RE = /\b(no|nope|don't|dont|cancel|stop|not now)\b/i;

function titleFromContent(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= TITLE_MAX) return trimmed;
  return `${trimmed.slice(0, TITLE_MAX - 1).trimEnd()}…`;
}

function buildAssistantContent(event: {
  text: string;
  content: readonly unknown[];
}): string {
  const isAskQuestionCall = (part: unknown): part is { input: unknown } =>
    typeof part === 'object' &&
    part !== null &&
    (part as { type?: unknown }).type === 'tool-call' &&
    (part as { toolName?: unknown }).toolName === ASK_QUESTION_TOOL;

  const questionCall = event.content.find(isAskQuestionCall);

  const lead = event.text.trim();
  if (!questionCall) return lead;

  const payload = questionCall.input as AskQuestionPayload;
  const json = JSON.stringify(payload);
  return lead
    ? `${lead}\n${ASK_QUESTION_MARKER}${json}`
    : `${ASK_QUESTION_MARKER}${json}`;
}

function confirmsDietSave(content: string): boolean {
  return (
    DIET_SAVE_CONFIRM_RE.test(content) && !DIET_SAVE_DECLINE_RE.test(content)
  );
}

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workoutRoutines: WorkoutRoutineService,
    private readonly exercises: ExercisesService,
    private readonly dietPlans: DietPlansService,
    @Inject(AI_MODEL_RESOLVER) private readonly resolveModel: AiModelResolver,
  ) {}

  async list(
    userId: Id,
    query: ChatQueryInput,
  ): Promise<Paginated<ChatConversation>> {
    const where = { userId };
    const { skip, take } = toSkipTake(query);

    const [rows, total] = await Promise.all([
      this.prisma.chatConversation.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.chatConversation.count({ where }),
    ]);

    return paginate(rows.map(toChatConversation), query, total);
  }

  async findById(userId: Id, id: Id): Promise<ChatConversationDetail> {
    const conversation = await this.getOwned(userId, id);
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      take: LIMITS.chatContextMessages,
    });

    return {
      ...toChatConversation(conversation),
      messages: messages.map(toChatMessage),
    };
  }

  async listMessages(
    userId: Id,
    conversationId: Id,
    query: ChatMessageQueryInput,
  ): Promise<Paginated<ChatMessage>> {
    await this.getOwned(userId, conversationId);

    const where = { conversationId };
    const { skip, take } = toSkipTake(query);

    const [rows, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.chatMessage.count({ where }),
    ]);

    return paginate(rows.map(toChatMessage), query, total);
  }

  async create(userId: Id, input: CreateChatInput): Promise<ChatConversation> {
    const row = await this.prisma.chatConversation.create({
      data: {
        userId,
        ...(input.title ? { title: input.title } : {}),
      },
    });

    return toChatConversation(row);
  }

  async update(
    userId: Id,
    id: Id,
    input: UpdateChatInput,
  ): Promise<ChatConversation> {
    await this.getOwned(userId, id);

    const row = await this.prisma.chatConversation.update({
      where: { id },
      data: { title: input.title },
    });

    return toChatConversation(row);
  }

  async remove(userId: Id, id: Id): Promise<void> {
    await this.getOwned(userId, id);

    await this.prisma.chatMessage.deleteMany({ where: { conversationId: id } });
    await this.prisma.chatConversation.delete({ where: { id } });
  }

  private userDetailsTool(userId: Id) {
    return tool({
      description:
        'This user’s profile: age, sex, height, weight, BMI, activity level, ' +
        'fitness goals, plus their computed BMR, TDEE and daily calorie ' +
        'target. Call before guessing any of these — never estimate calorie ' +
        'figures yourself, quote the ones returned here.',
      inputSchema: z.object({}),
      execute: async () => {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user) throw new Error('User no longer exists');

        const latest = await this.prisma.bodyMeasurement.findFirst({
          where: { userId },
          orderBy: { recordedAt: 'desc' },
        });

        const heightCm = user.profile.heightCm ?? null;
        const weightKg = latest?.weightKg ?? null;
        const ageYears = user.profile.dateOfBirth
          ? yearsSince(user.profile.dateOfBirth)
          : null;
        const bmi =
          heightCm && weightKg ? calculateBmi(heightCm, weightKg) : null;

        const settings = await this.prisma.appSettings.findFirst();
        const energy = energyProfile(
          {
            weightKg,
            heightCm,
            ageYears,
            sex: user.profile.sex ?? null,
            activityLevel: user.profile.activityLevel ?? null,
            fitnessGoals: user.profile.fitnessGoals,
          },
          toCalorieConfig(settings?.calorieConfig),
        );

        return {
          displayName: user.profile.displayName,
          ageYears,
          sex: user.profile.sex ?? null,
          heightCm,
          weightKg,
          activityLevel: user.profile.activityLevel ?? null,
          fitnessGoals: user.profile.fitnessGoals,
          bmi,
          bmiCategory: bmi ? bmiCategory(bmi) : null,
          // Computed server-side — quote these rather than inventing figures.
          bmr: energy.bmr,
          tdee: energy.tdee,
          targetCalories: energy.targetCalories,
          units: user.preferences.units,
        };
      },
    });
  }

  private askQuestionTool() {
    return tool({
      description:
        'Ask a short multiple-choice question (2-5 options) when you need ' +
        'the user to decide something instead of guessing. Ends your turn ' +
        '— no other text alongside it; their tap is their next message.',
      inputSchema: z.object({
        question: z.string().trim().min(1).max(200),
        options: z.array(z.string().trim().min(1).max(60)).min(2).max(5),
        allowMultiple: z.boolean().optional(),
      }),
    });
  }

  private getCurrentRoutineTool(userId: Id) {
    return tool({
      description:
        'This user’s current AI-generated weekly workout routine (status, ' +
        'days, exercises). Call before discussing or editing it.',
      inputSchema: z.object({}),
      execute: async () => {
        try {
          return await this.workoutRoutines.findCurrent(userId);
        } catch {
          return {
            status: 'none',
            message:
              'This user has no workout routine yet — one is generated ' +
              'automatically after signup, or they can trigger it from the ' +
              'app’s home screen.',
          };
        }
      },
    });
  }

  private listExercisesTool(userId: Id) {
    return tool({
      description:
        'Search the exercise catalogue for valid exerciseId values. Call ' +
        'before updateRoutineDay — never invent an id.',
      inputSchema: z.object({
        search: z.string().trim().min(1).max(120).optional(),
        muscleGroup: muscleGroupSchema.optional(),
        equipment: equipmentSchema.optional(),
      }),
      execute: async ({ search, muscleGroup, equipment }) => {
        const page = await this.exercises.list(
          userId,
          exerciseQuerySchema.parse({
            search,
            muscleGroup,
            equipment,
            limit: 40,
          }),
        );
        return page.items.map((exercise) => ({
          exerciseId: exercise.id,
          name: exercise.name,
          category: exercise.category,
          primaryMuscles: exercise.primaryMuscles,
          equipment: exercise.equipment,
        }));
      },
    });
  }

  private updateRoutineDayTool(userId: Id) {
    return tool({
      description:
        'Edit one weekday of the user’s active routine (exercises, focus, ' +
        'step target, or make it rest). `exercises`, if given, fully ' +
        'replaces that day’s list — include every exercise it should end ' +
        'up with, not just the changed one. Ids from listExercises. Ask ' +
        'via askQuestion first if it’s ambiguous which day/exercise is meant.',
      inputSchema: z.object({
        dayOfWeek: dayOfWeekSchema,
        status: routineDayStatusSchema.optional(),
        focus: z.string().trim().min(1).max(120).optional(),
        stepsTarget: z.number().int().nonnegative().optional(),
        exercises: z
          .array(
            z.object({
              exerciseId: z.string(),
              sets: z.number().int().positive(),
              reps: z.number().int().positive().optional(),
              durationSec: z.number().int().positive().optional(),
              restSeconds: z.number().int().positive().optional(),
              estimatedCalories: z.number().int().positive().optional(),
            }),
          )
          .max(30)
          .optional(),
      }),
      execute: async ({ dayOfWeek, ...patch }) =>
        this.workoutRoutines.updateDay(userId, dayOfWeek, patch),
    });
  }

  private getCurrentDietPlanTool(userId: Id) {
    return tool({
      description:
        'This user’s current AI-generated weekly diet plan (status, diet ' +
        'type, cuisine, excluded foods, days, meals). Call before ' +
        'discussing or editing it.',
      inputSchema: z.object({}),
      execute: async () => {
        try {
          return await this.dietPlans.findCurrent(userId);
        } catch {
          return {
            status: 'none',
            message:
              'This user has no diet plan yet — they can create one from ' +
              'the app’s Diet tab, or you can call regenerateDietPlan to ' +
              'make one now.',
          };
        }
      },
    });
  }

  private updateDietDayTool(userId: Id) {
    return tool({
      description:
        'Edit one weekday of the user’s active diet plan — retarget its ' +
        'calories/macros, or replace its meals. `meals`, if given, fully ' +
        'replaces that day’s meal list — include every meal it should end ' +
        'up with (with every one of its items), not just the changed one. ' +
        'Use this for a single-day change (swap a meal, add a snack, drop ' +
        'an item); for a plan-wide change (diet type, cuisine, excluded ' +
        'foods, meals per day) use regenerateDietPlan instead. Ask via ' +
        'askQuestion first if it’s ambiguous which day/meal is meant.',
      inputSchema: z.object({
        dayOfWeek: dayOfWeekSchema,
        targetCalories: z.number().int().nonnegative().optional(),
        targetProteinG: z.number().int().nonnegative().optional(),
        targetFatG: z.number().int().nonnegative().optional(),
        targetCarbsG: z.number().int().nonnegative().optional(),
        meals: z
          .array(
            z.object({
              name: z.string().trim().min(1).max(80),
              items: z
                .array(
                  z.object({
                    name: z.string().trim().min(1).max(120),
                    description: z.string().trim().min(1).max(120).optional(),
                    calories: z.number().int().nonnegative(),
                    proteinG: z.number().int().nonnegative(),
                    fatG: z.number().int().nonnegative(),
                    carbsG: z.number().int().nonnegative(),
                  }),
                )
                .min(1)
                .max(6),
            }),
          )
          .max(6)
          .optional(),
      }),
      execute: async ({ dayOfWeek, ...patch }) =>
        this.dietPlans.updateDay(userId, dayOfWeek, patch),
    });
  }

  private regenerateDietPlanTool(userId: Id, latestUserContent: string) {
    return tool({
      description:
        'Rebuild the user’s ENTIRE weekly diet plan with new preferences ' +
        '— diet type, cuisine, excluded foods and/or meals per day. Use ' +
        'this for a plan-wide change ("make me vegan", "switch to Italian ' +
        'food", "5 meals a day instead of 4") or a first-time plan, not a ' +
        'single-day edit (use updateDietDay for that). Any field left ' +
        'unset keeps what the user currently has, or a sensible default ' +
        'for a first plan — call this with whatever they told you rather ' +
        'than interrogating them field by field. Only ask first — with ' +
        'askQuestion, one specific thing, never several bundled into one ' +
        'message — when a field is genuinely ambiguous (e.g. "change my ' +
        'diet" with no hint which way). Before calling this tool, the ' +
        'latest user reply must clearly confirm saving the 7-day plan to ' +
        'their Diets list after you ask "Should I update this in your ' +
        'Diets list?". If not confirmed yet, use askQuestion first.',
      inputSchema: z.object({
        dietTypes: z.array(dietTypeSchema).min(1).max(3).optional(),
        cuisine: dietCuisineSchema.optional(),
        exclude: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
        mealsPerDay: z.number().int().min(2).max(6).optional(),
      }),
      execute: async (input) => {
        if (!confirmsDietSave(latestUserContent)) {
          return {
            status: 'needs_confirmation',
            message:
              'Ask the user to confirm before saving: "Should I update this in your Diets list?"',
          };
        }

        const current = await this.dietPlans
          .findCurrent(userId)
          .catch(() => null);

        const merged: GenerateDietPlanInput = generateDietPlanSchema.parse({
          dietTypes: input.dietTypes ?? current?.dietTypes,
          cuisine: input.cuisine ?? current?.cuisine,
          exclude: input.exclude ?? current?.exclude,
          mealsPerDay: input.mealsPerDay ?? current?.mealsPerDay,
        });

        // No request/IP available from a chat tool call — fine, since
        // `cuisine` only falls back to IP-resolution when still unset after
        // merging with the current plan, which only happens for a brand new
        // plan where the model also didn't specify one.
        return this.dietPlans.regenerate(userId, merged, undefined);
      },
    });
  }

  private async profileSnapshot(userId: Id): Promise<ChatProfileSnapshot> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const latest = await this.prisma.bodyMeasurement.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });
    const currentDietPlan = await this.prisma.dietPlan.findFirst({
      where: { userId, status: { in: ['active', 'generating'] } },
      orderBy: { createdAt: 'desc' },
      select: {
        dietTypes: true,
        cuisine: true,
        exclude: true,
        mealsPerDay: true,
      },
    });

    return {
      ageYears: user.profile.dateOfBirth
        ? yearsSince(user.profile.dateOfBirth)
        : null,
      sex: user.profile.sex ?? null,
      heightCm: user.profile.heightCm ?? null,
      weightKg: latest?.weightKg ?? null,
      activityLevel: user.profile.activityLevel ?? null,
      fitnessGoals: user.profile.fitnessGoals,
      dietTypes: currentDietPlan?.dietTypes ?? [],
      dietCuisine: currentDietPlan?.cuisine ?? null,
      dietExclusions: currentDietPlan?.exclude ?? [],
      mealsPerDay: currentDietPlan?.mealsPerDay ?? null,
    };
  }

  private deterministicPlan(workflow: ChatWorkflow): ChatWorkflowPlan {
    const responseMode =
      workflow.state === 'needs_profile_input'
        ? 'ask_profile_question'
        : workflow.intent === 'personalized_plan' ||
            workflow.intent === 'personalized_edit'
          ? 'edit_or_generate'
          : 'answer';

    return {
      workflowState: workflow.state,
      responseMode,
      requiredToolNames:
        workflow.state === 'ready_for_personalized_answer'
          ? workflow.requiresDietPreferences
            ? ['getUserDetails', 'getCurrentDietPlan']
            : ['getUserDetails']
          : [],
      assumptions: [],
      answerOutline:
        workflow.state === 'needs_profile_input'
          ? [`Ask for ${workflow.missingProfileFields[0]}.`]
          : ['Answer briefly within Fit Crate scope.'],
    };
  }

  private async planWorkflow(
    model: LanguageModel,
    content: string,
    workflow: ChatWorkflow,
  ): Promise<ChatWorkflowPlan> {
    try {
      const result = await generateObject({
        model,
        schema: chatWorkflowPlanSchema,
        system:
          'Create a compact execution plan for a fitness chat reply. ' +
          'Respect the provided workflow exactly.',
        prompt: buildWorkflowPlannerPrompt(content, workflow),
      });
      return result.object;
    } catch (error) {
      this.logger.warn(
        `Chat workflow planner failed; using deterministic fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.deterministicPlan(workflow);
    }
  }

  async streamReply(
    userId: Id,
    conversationId: Id,
    input: SendChatMessageInput,
  ) {
    const settings = await this.prisma.appSettings.findFirst();
    const modelConfig = resolveModelConfig(
      PromptCategory.UserChat,
      settings?.aiPrompts,
    );
    const model = requireModel(this.resolveModel(modelConfig));
    const conversation = await this.getOwned(userId, conversationId);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if ((user.remainingCredits ?? 0) < 1) {
      throw new HttpException(
        'No chat credits remaining. Upgrade your plan or wait for a reset.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const now = new Date();
    const userMessageRow = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role: ChatMessageRole.User,
        content: input.content,
      },
    });

    const shouldSetTitle = !conversation.title;
    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: now,
        ...(shouldSetTitle ? { title: titleFromContent(input.content) } : {}),
      },
    });

    const [history, profile] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: LIMITS.chatContextMessages,
      }),
      this.profileSnapshot(userId),
    ]);

    const workflow = buildChatWorkflow(input.content, profile);
    const workflowPlan = await this.planWorkflow(
      model,
      input.content,
      workflow,
    );

    const messages = history
      .reverse()
      .filter((message) => message.role !== ChatMessageRole.System)
      .map((message) => {
        // Strip the askQuestion marker+JSON back down to plain text so the
        // model doesn't see its own wire-format output as a prior turn.
        const lead = (
          message.content.split(ASK_QUESTION_MARKER)[0] ?? ''
        ).trim();
        return {
          role: message.role as 'user' | 'assistant',
          content:
            message.id === userMessageRow.id
              ? buildFinalWorkflowInstruction(
                  workflow,
                  workflowPlan,
                  lead || message.content,
                )
              : lead || '(asked a clarifying question)',
        };
      });

    const system = resolvePrompt(PromptCategory.UserChat, settings?.aiPrompts);

    const result = streamText({
      model,
      system,
      messages,
      tools: {
        getUserDetails: this.userDetailsTool(userId),
        getCurrentRoutine: this.getCurrentRoutineTool(userId),
        listExercises: this.listExercisesTool(userId),
        updateRoutineDay: this.updateRoutineDayTool(userId),
        getCurrentDietPlan: this.getCurrentDietPlanTool(userId),
        updateDietDay: this.updateDietDayTool(userId),
        regenerateDietPlan: this.regenerateDietPlanTool(userId, input.content),
        [ASK_QUESTION_TOOL]: this.askQuestionTool(),
      },
      stopWhen: stepCountIs(MAX_AGENT_STEPS),
      onFinish: async (event) => {
        const content = buildAssistantContent(event);
        if (!content) return;

        const inputTokens = event.totalUsage.inputTokens ?? 0;
        const outputTokens = event.totalUsage.outputTokens ?? 0;
        const totalTokens =
          event.totalUsage.totalTokens ?? inputTokens + outputTokens;
        const citations = workflow.citations;

        this.logger.log(
          `Chat reply for user ${userId} (conversation ${conversationId}): ` +
            `${inputTokens} input + ${outputTokens} output = ${totalTokens} tokens, ` +
            `intent=${workflow.intent}, state=${workflow.state}`,
        );

        await this.prisma.chatMessage.create({
          data: {
            conversationId,
            role: ChatMessageRole.Assistant,
            content,
            citations,
            inputTokens,
            outputTokens,
            totalTokens,
          },
        });

        await this.prisma.chatConversation.update({
          where: { id: conversationId },
          data: {
            messageCount: { increment: 1 },
            lastMessageAt: new Date(),
          },
        });

        await this.prisma.user.updateMany({
          where: { id: userId, remainingCredits: { gt: 0 } },
          data: {
            remainingCredits: { decrement: 1 },
            lifetimeInputTokens: { increment: inputTokens },
            lifetimeOutputTokens: { increment: outputTokens },
            lifetimeTotalTokens: { increment: totalTokens },
          },
        });
      },
    });

    return {
      userMessage: toChatMessage(userMessageRow),
      result,
    };
  }

  private async getOwned(userId: Id, id: Id): Promise<ChatConversationRow> {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }
}
