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
import type {
  ChatMessageQueryInput,
  ChatQueryInput,
  CreateChatInput,
  SendChatMessageInput,
  UpdateChatInput,
} from '@fitness/validation';
import { stepCountIs, streamText, tool, type LanguageModel } from 'ai';
import { z } from 'zod';

import { AI_MODEL, requireModel } from '../ai/ai.module';
import { LIMITS } from '../config/constants';
import { PrismaService } from '../prisma/prisma.service';

const TITLE_MAX = LIMITS.chatTitle.max;
const ASK_QUESTION_TOOL = 'askQuestion';
// getUserDetails, then (optionally) askQuestion or a final answer.
const MAX_AGENT_STEPS = 4;

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

/**
 * Fold the last step's text and, if the turn ended in an `askQuestion` call,
 * the question/options into the single string persisted as
 * `ChatMessage.content` (see `ASK_QUESTION_MARKER` for the wire format).
 */
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
        'Get this user’s profile: age, sex, height, weight, BMI, activity ' +
        'level and the fitness goals they chose. Call this before asking the ' +
        'user for facts you can look up, or before giving advice that ' +
        'depends on their body stats or goals.',
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
        'Ask the user a short multiple-choice question when you need them ' +
        'to decide something rather than guessing (their goal for today, ' +
        'which day, how experienced they are, etc). Give 2-5 short options. ' +
        'This ends your turn — write no other text alongside it, the ' +
        'question and options are shown to the user directly and their tap ' +
        'arrives as their next message.',
      inputSchema: z.object({
        question: z.string().trim().min(1).max(200),
        options: z.array(z.string().trim().min(1).max(60)).min(2).max(5),
        allowMultiple: z.boolean().optional(),
      }),
      // No `execute`: this is a client-side/human-in-the-loop tool. A tool
      // call with no result ends the agent loop right away so the stream
      // closes and waits for the user's tap instead of the model rambling on.
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
