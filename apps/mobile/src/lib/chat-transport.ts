import { AUTH } from '@fitness/config';
import type { AuthTokens } from '@fitness/types';
import { DefaultChatTransport, isTextUIPart, type UIMessage } from 'ai';
import axios from 'axios';
import { fetch as expoFetch } from 'expo/fetch';

import { API_BASE_URL } from '@/api/http';
import { authState } from '@/stores/auth.store';

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

/**
 * Expo-compatible fetch with bearer auth + one refresh retry.
 * Uses `expo/fetch` so AI SDK text streams work on device.
 */
async function authenticatedExpoFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString();

  const send = async (accessToken: string | undefined) => {
    const headers = new Headers(init?.headers);
    if (accessToken) {
      headers.set(AUTH.headerName, `${AUTH.scheme} ${accessToken}`);
    }
    return expoFetch(url, { ...init, headers });
  };

  let response = await send(authState.tokens()?.accessToken);
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await send(refreshed);
    }
  }
  return response;
}

function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role !== 'user') continue;
    return message.parts
      .filter(isTextUIPart)
      .map((part) => part.text)
      .join('')
      .trim();
  }
  return '';
}

export function createCoachChatTransport(conversationId: string) {
  return new DefaultChatTransport({
    api: `${API_BASE_URL}/chats/${conversationId}/messages`,
    fetch: authenticatedExpoFetch as unknown as typeof globalThis.fetch,
    prepareSendMessagesRequest: ({ messages, headers, api }) => ({
      api,
      headers,
      body: { content: lastUserText(messages) },
    }),
  });
}
