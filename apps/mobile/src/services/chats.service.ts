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
  SendChatMessageInput,
  UpdateChatInput,
} from '@fitness/validation';
import { AUTH } from '@fitness/config';
import type { AuthTokens } from '@fitness/types';
import type { AxiosInstance } from 'axios';
import axios from 'axios';

import { ApiError, NetworkError, normaliseError } from '@/api/errors';
import { API_BASE_URL, http } from '@/api/http';
import { authState } from '@/stores/auth.store';

import { BaseService } from './base.service';

export type StreamChatCallbacks = {
  onUserMessageId?: (id: string) => void;
  /** Called with the full assistant text accumulated so far. */
  onChunk: (text: string) => void;
};

async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = authState.tokens()?.refreshToken;
    if (!refreshToken) return null;

    const { data } = await axios.post<AuthTokens>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { accept: 'application/json' } },
    );
    authState.setTokens(data);
    return data.accessToken;
  } catch {
    authState.clear();
    return null;
  }
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    accept: 'text/plain',
    'content-type': 'application/json',
    [AUTH.headerName]: `${AUTH.scheme} ${accessToken}`,
  };
}

async function readStreamText(
  response: Response,
  onChunk: (text: string) => void,
): Promise<string> {
  const body = response.body;
  if (body && typeof body.getReader === 'function') {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
      onChunk(full);
    }

    full += decoder.decode();
    if (full) onChunk(full);
    return full;
  }

  const text = await response.text();
  onChunk(text);
  return text;
}

async function parseErrorResponse(response: Response): Promise<never> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    try {
      body = { message: await response.text() };
    } catch {
      body = null;
    }
  }

  const message =
    body !== null &&
    typeof body === 'object' &&
    'message' in body &&
    (body as { message: unknown }).message != null
      ? String((body as { message: unknown }).message)
      : `Request failed with ${response.status}`;

  throw new ApiError(
    response.status,
    message,
    body !== null && typeof body === 'object'
      ? (body as import('@fitness/types').ApiErrorBody)
      : null,
  );
}

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

  /**
   * Sends a user message and streams the assistant reply as plain text
   * (AI SDK `pipeTextStreamToResponse`). Uses `fetch` so chunks can arrive
   * before the response completes.
   */
  async streamMessage(
    conversationId: string,
    input: SendChatMessageInput,
    callbacks: StreamChatCallbacks,
  ): Promise<string> {
    try {
      let accessToken = authState.tokens()?.accessToken;
      if (!accessToken) {
        throw new ApiError(401, 'Not authenticated', null);
      }

      let response = await fetch(
        `${API_BASE_URL}${this.url(conversationId, 'messages')}`,
        {
          method: 'POST',
          headers: authHeaders(accessToken),
          body: JSON.stringify(input),
        },
      );

      if (response.status === 401) {
        accessToken = (await refreshAccessToken()) ?? undefined;
        if (!accessToken) {
          throw new ApiError(401, 'Not authenticated', null);
        }
        response = await fetch(
          `${API_BASE_URL}${this.url(conversationId, 'messages')}`,
          {
            method: 'POST',
            headers: authHeaders(accessToken),
            body: JSON.stringify(input),
          },
        );
      }

      if (!response.ok) {
        await parseErrorResponse(response);
      }

      const userMessageId = response.headers.get('X-User-Message-Id');
      if (userMessageId) callbacks.onUserMessageId?.(userMessageId);

      return await readStreamText(response, callbacks.onChunk);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof TypeError) {
        throw new NetworkError(error.message || 'Network request failed', error);
      }
      throw normaliseError(error);
    }
  }
}

export const chatsService = new ChatsService();
