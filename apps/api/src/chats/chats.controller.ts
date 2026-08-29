import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {
  AuthenticatedUser,
  ChatConversation,
  ChatConversationDetail,
  ChatMessage,
  Paginated,
} from '@fitness/types';
import {
  chatConversationDetailSchema,
  chatConversationSchema,
  chatMessageQuerySchema,
  chatMessageSchema,
  chatQuerySchema,
  createChatSchema,
  objectIdSchema,
  sendChatMessageSchema,
  updateChatSchema,
  type ChatMessageQueryInput,
  type ChatQueryInput,
  type CreateChatInput,
  type SendChatMessageInput,
  type UpdateChatInput,
} from '@fitness/validation';
import type { Response } from 'express';

import { CurrentUser } from '../common/decorators';
import { ApiZodBody, ApiZodQuery, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { ChatsService } from './chats.service';

@ApiTags('chats')
@ApiBearerAuth('access-token')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chats: ChatsService) {}

  @Get()
  @ApiOperation({ summary: 'List your chat conversations' })
  @ApiZodQuery(chatQuerySchema)
  @ApiZodResponse(chatConversationSchema, {
    paginated: true,
    description: 'Page of conversations',
    name: 'ChatConversation',
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(chatQuerySchema)) query: ChatQueryInput,
  ): Promise<Paginated<ChatConversation>> {
    return this.chats.list(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a chat conversation' })
  @ApiZodBody(createChatSchema)
  @ApiZodResponse(chatConversationSchema, {
    status: 201,
    description: 'Created conversation',
    name: 'ChatConversation',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(createChatSchema)) body: CreateChatInput,
  ): Promise<ChatConversation> {
    return this.chats.create(user.id, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a conversation with recent messages' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(chatConversationDetailSchema, {
    description: 'Conversation with messages',
    name: 'ChatConversationDetail',
  })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<ChatConversationDetail> {
    return this.chats.findById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a conversation' })
  @ApiZodBody(updateChatSchema)
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(chatConversationSchema, {
    description: 'Updated conversation',
    name: 'ChatConversation',
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(updateChatSchema)) body: UpdateChatInput,
  ): Promise<ChatConversation> {
    return this.chats.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a conversation and its messages' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<void> {
    return this.chats.remove(user.id, id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'List messages in a conversation' })
  @ApiZodQuery(chatMessageQuerySchema)
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(chatMessageSchema, {
    paginated: true,
    description: 'Page of messages',
    name: 'ChatMessage',
  })
  listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Query(zodPipe(chatMessageQuerySchema)) query: ChatMessageQueryInput,
  ): Promise<Paginated<ChatMessage>> {
    return this.chats.listMessages(user.id, id, query);
  }

  @Post(':id/messages')
  @ApiOperation({
    summary: 'Send a message and stream the assistant reply (AI SDK text stream)',
  })
  @ApiZodBody(sendChatMessageSchema)
  @ApiProduces('text/plain')
  @ApiResponse({
    status: 200,
    description:
      'Plain-text stream of the assistant reply. Headers include X-User-Message-Id.',
    content: {
      'text/plain': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 402, description: 'No chat credits remaining' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 503, description: 'AI unavailable' })
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(sendChatMessageSchema)) body: SendChatMessageInput,
    @Res() res: Response,
  ): Promise<void> {
    const { userMessage, result } = await this.chats.streamReply(
      user.id,
      id,
      body,
    );

    res.setHeader('X-User-Message-Id', userMessage.id);
    res.setHeader('X-Conversation-Id', id);
    // Expose custom headers to browser clients (admin/web).
    res.setHeader(
      'Access-Control-Expose-Headers',
      'X-User-Message-Id, X-Conversation-Id',
    );

    await result.pipeTextStreamToResponse(res);
  }
}
