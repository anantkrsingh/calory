import { API_PREFIX, API_VERSION, AUTH } from '@fitness/config';
import type { AuthTokens } from '@fitness/types';
import axios, { create, isAxiosError, type AxiosInstance } from 'axios';

import { authState } from '@/stores/auth.store';

import { normaliseError } from './errors';

declare module 'axios' {
  // Extra per-request switches the interceptors below read back off the config.
  export interface AxiosRequestConfig {
    /** Skip the Authorization header — used by login/register/refresh. */
    skipAuth?: boolean;
    /** Internal: prevents a refresh loop when the retried request 401s again. */
    skipRetry?: boolean;
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  `http://localhost:3000/${API_PREFIX}/${API_VERSION}`
).replace(/\/+$/, '');

/** Repeats keys (`tag=a&tag=b`) — what the API's zod array coercion expects. */
function serialiseParams(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item));
    } else {
      params.append(key, String(value));
    }
  }
  return params.toString();
}

/**
 * The single axios instance every service talks through. Auth headers and the
 * refresh-once-on-401 dance live in the interceptors below.
 */
export const http: AxiosInstance = create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: { accept: 'application/json' },
  paramsSerializer: { serialize: serialiseParams },
});

let onUnauthorized: (() => void) | undefined;

/** Routes back to login once a refresh fails and the session is unrecoverable. */
export function setOnUnauthorized(handler: (() => void) | undefined): void {
  onUnauthorized = handler;
}

http.interceptors.request.use((config) => {
  if (config.skipAuth) return config;

  // MMKV-backed, so this read is synchronous — no await in the hot path.
  const accessToken = authState.tokens()?.accessToken;
  if (accessToken) {
    config.headers.set(AUTH.headerName, `${AUTH.scheme} ${accessToken}`);
  }
  return config;
});

/** In-flight refresh, shared so concurrent 401s trigger exactly one refresh. */
let refreshInFlight: Promise<AuthTokens | null> | null = null;

/** Refreshes at most once per burst of 401s; resolves null when unrecoverable. */
function tryRefresh(): Promise<AuthTokens | null> {
  refreshInFlight ??= (async () => {
    try {
      const refreshToken = authState.tokens()?.refreshToken;
      if (!refreshToken) return null;

      // Bypasses `http` so a 401 here cannot re-enter the interceptor below.
      const { data } = await axios.post<AuthTokens>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { headers: { accept: 'application/json' } },
      );
      authState.setTokens(data);
      return data;
    } catch {
      authState.clear();
      onUnauthorized?.();
      return null;
    } finally {
      // Cleared in a microtask so every awaiter observes the same result first.
      queueMicrotask(() => {
        refreshInFlight = null;
      });
    }
  })();

  return refreshInFlight;
}

http.interceptors.response.use(
  (response) => {
    // 204s arrive as an empty string; normalise to null for `Promise<void>` callers.
    if (response.data === '') response.data = null;
    return response;
  },
  async (error: unknown) => {
    const config = isAxiosError(error) ? error.config : undefined;
    const status = isAxiosError(error) ? error.response?.status : undefined;

    if (status === 401 && config && !config.skipAuth && !config.skipRetry) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return http.request({ ...config, skipRetry: true });
      }
    }

    throw normaliseError(error);
  },
);
