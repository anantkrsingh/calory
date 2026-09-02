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
  toChatConversation,
  toChatMessage,
  toSkipTake,
  type ChatConversationRow,
} from '@fitness/db';
import { resolvePrompt } from '@fitness/ai';
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
} from '@fitness/types';
import {
  dayOfWeekSchema,
  equipmentSchema,
  exerciseQuerySchema,
  muscleGroupSchema,
  routineDayStatusSchema,
  type ChatMessageQueryInput,
  type ChatQueryInput,
  type CreateChatInput,
  type SendChatMessageInput,
  type UpdateChatInput,
} from '@fitness/validation';
import { stepCountIs, streamText, tool, type LanguageModel } from 'ai';
import { z } from 'zod';

import { AI_MODEL, requireModel } from '../ai/ai.module';
import { LIMITS } from '../config/constants';
import { ExercisesService } from '../exercises/exercises.service';
import { PrismaService } from '../prisma/prisma.service';
import { WorkoutRoutineService } from '../routines/workout-routine.service';

const TITLE_MAX = LIMITS.chatTitle.max;
const ASK_QUESTION_TOOL = 'askQuestion';
// getUserDetails/getCurrentRoutine/listExercises, an edit, then (optionally)
// askQuestion or a final answer.
const MAX_AGENT_STEPS = 6;

function titleFromContent(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= TITLE_MAX) return trimmed;
  return `${trimmed.slice(0, TITLE_MAX - 1).trimEnd()}…`;
}

const yearsSince = (isoDate: string): number | null => {
  const born = new Date(isoDate);
  if (Number.isNaN(born.getTime())) return null;
  const ms = Date.now() - born.getTime();
  return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
};

/** Standard BMI = kg / m^2, rounded to one decimal. */
const calculateBmi = (heightCm: number, weightKg: number): number => {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
};

const bmiCategory = (bmi: number): string => {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
};


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

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workoutRoutines: WorkoutRoutineService,
    private readonly exercises: ExercisesService,
    @Inject(AI_MODEL) private readonly model: LanguageModel | null,
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
        'fitness goals. Call before guessing any of these.',
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
        const bmi =
          heightCm && weightKg ? calculateBmi(heightCm, weightKg) : null;

        return {
          displayName: user.profile.displayName,
          ageYears: user.profile.dateOfBirth
            ? yearsSince(user.profile.dateOfBirth)
            : null,
          sex: user.profile.sex ?? null,
          heightCm,
          weightKg,
          activityLevel: user.profile.activityLevel ?? null,
          fitnessGoals: user.profile.fitnessGoals,
          bmi,
          bmiCategory: bmi ? bmiCategory(bmi) : null,
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

  async streamReply(
    userId: Id,
    conversationId: Id,
    input: SendChatMessageInput,
  ) {
    const model = requireModel(this.model);
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

    const history = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: LIMITS.chatContextMessages,
    });

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
          content: lead || '(asked a clarifying question)',
        };
      });

    const settings = await this.prisma.appSettings.findFirst();
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

        this.logger.log(
          `Chat reply for user ${userId} (conversation ${conversationId}): ` +
            `${inputTokens} input + ${outputTokens} output = ${totalTokens} tokens`,
        );

        await this.prisma.chatMessage.create({
          data: {
            conversationId,
            role: ChatMessageRole.Assistant,
            content,
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
