import type {
  ChatConversation,
  ChatConversationDetail,
  ChatMessage,
  Paginated,
} from '@fitness/types';
import type {
  ChatMessageQueryInput,
  ChatQueryInput,
  CreateChatInput,
  UpdateChatInput,
} from '@fitness/validation';
import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';

import { BaseService } from './base.service';

export class ChatsService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/chats', client);
  }

  async list(query: ChatQueryInput = {}): Promise<Paginated<ChatConversation>> {
    const { data } = await this.client.get<Paginated<ChatConversation>>(
      this.path,
      { params: query },
    );
    return data;
  }

  async get(id: string): Promise<ChatConversationDetail> {
    const { data } = await this.client.get<ChatConversationDetail>(
      this.url(id),
    );
    return data;
  }

  async listMessages(
    id: string,
    query: ChatMessageQueryInput = {},
  ): Promise<Paginated<ChatMessage>> {
    const { data } = await this.client.get<Paginated<ChatMessage>>(
      this.url(id, 'messages'),
      { params: query },
    );
    return data;
  }

  async create(input: CreateChatInput = {}): Promise<ChatConversation> {
    const { data } = await this.client.post<ChatConversation>(this.path, input);
    return data;
  }

  async update(
    id: string,
    input: UpdateChatInput,
  ): Promise<ChatConversation> {
    const { data } = await this.client.patch<ChatConversation>(
      this.url(id),
      input,
    );
    return data;
  }

  async remove(id: string): Promise<void> {
    await this.client.delete(this.url(id));
  }
}

export const chatsService = new ChatsService();
