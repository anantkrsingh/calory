import {
  Inject,
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LIMITS } from '@fitness/config';
import {
  paginate,
  toChatConversation,
  toChatMessage,
  toSkipTake,
  type ChatConversationRow,
} from '@fitness/db';
import { resolvePrompt } from '@fitness/ai';
import type {
  ChatConversation,
  ChatConversationDetail,
  ChatMessage,
  Id,
  Paginated,
} from '@fitness/types';
import { ChatMessageRole, PromptCategory } from '@fitness/types';
import type {
  ChatMessageQueryInput,
  ChatQueryInput,
  CreateChatInput,
  SendChatMessageInput,
  UpdateChatInput,
} from '@fitness/validation';
import { streamText, type LanguageModel } from 'ai';

import { AI_MODEL, requireModel } from '../ai/ai.module';
import { PrismaService } from '../prisma/prisma.service';

const TITLE_MAX = LIMITS.chatTitle.max;

function titleFromContent(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= TITLE_MAX) return trimmed;
  return `${trimmed.slice(0, TITLE_MAX - 1).trimEnd()}…`;
}

@Injectable()
export class ChatsService {
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

  async create(
    userId: Id,
    input: CreateChatInput,
  ): Promise<ChatConversation> {
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

  /**
   * Persists the user message, then returns an AI SDK text stream for the
   * assistant reply. The caller pipes the stream to the HTTP response.
   * On successful finish the assistant message is saved and one credit spent.
   */
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
        ...(shouldSetTitle
          ? { title: titleFromContent(input.content) }
          : {}),
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
      .map((message) => ({
        role: message.role as 'user' | 'assistant',
        content: message.content,
      }));

    const settings = await this.prisma.appSettings.findFirst();
    const system = resolvePrompt(PromptCategory.UserChat, settings?.aiPrompts);

    const result = streamText({
      model,
      system,
      messages,
      onFinish: async ({ text }) => {
        const content = text.trim();
        if (!content) return;

        await this.prisma.chatMessage.create({
          data: {
            conversationId,
            role: ChatMessageRole.Assistant,
            content,
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
          data: { remainingCredits: { decrement: 1 } },
        });
      },
    });

    return {
      userMessage: toChatMessage(userMessageRow),
      result,
    };
  }

  private async getOwned(
    userId: Id,
    id: Id,
  ): Promise<ChatConversationRow> {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }
}
