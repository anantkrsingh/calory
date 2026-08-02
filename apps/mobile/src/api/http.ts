import { API_PREFIX, API_VERSION, AUTH } from '@fitness/config';
import type { AuthTokens } from '@fitness/types';
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';

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

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

export type QueryParams = Record<string, QueryValue>;

export interface RequestOptions
  extends Omit<AxiosRequestConfig, 'url' | 'method' | 'data' | 'params'> {
  query?: QueryParams;
  body?: unknown;
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
 * refresh-once-on-401 dance live here so services stay pure endpoint maps.
 */
export class HttpClient {
  private readonly instance: AxiosInstance;

  /** In-flight refresh, shared so concurrent 401s trigger exactly one refresh. */
  private refreshInFlight: Promise<AuthTokens | null> | null = null;

  private onUnauthorized?: () => void;

  constructor(
    baseURL: string = API_BASE_URL,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {
    this.instance = axios.create({
      baseURL: baseURL.replace(/\/+$/, ''),
      timeout: timeoutMs,
      headers: { accept: 'application/json' },
      paramsSerializer: { serialize: serialiseParams },
    });

    this.instance.interceptors.request.use((config) => {
      if (config.skipAuth) return config;

      // MMKV-backed, so this read is synchronous — no await in the hot path.
      const accessToken = authState.tokens()?.accessToken;
      if (accessToken) {
        config.headers.set(AUTH.headerName, `${AUTH.scheme} ${accessToken}`);
      }
      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        const config = axios.isAxiosError(error) ? error.config : undefined;
        const status = axios.isAxiosError(error)
          ? error.response?.status
          : undefined;

        if (status === 401 && config && !config.skipAuth && !config.skipRetry) {
          const refreshed = await this.tryRefresh();
          if (refreshed) {
            return this.instance.request({ ...config, skipRetry: true });
          }
        }

        throw normaliseError(error);
      },
    );
  }

  /** Routes back to login once a refresh fails and the session is unrecoverable. */
  setOnUnauthorized(handler: (() => void) | undefined): void {
    this.onUnauthorized = handler;
  }

  get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  post<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('POST', path, options);
  }

  patch<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PATCH', path, options);
  }

  put<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PUT', path, options);
  }

  delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  private async request<T>(
    method: string,
    path: string,
    { query, body, ...config }: RequestOptions,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.request<T>({
      ...config,
      method,
      url: path.startsWith('/') ? path : `/${path}`,
      params: query,
      data: body,
    });

    // 204s arrive as an empty string; normalise to null for `Promise<void>`.
    return (response.data === '' ? null : response.data) as T;
  }

  /** Refreshes at most once per burst of 401s; resolves null when unrecoverable. */
  private tryRefresh(): Promise<AuthTokens | null> {
    this.refreshInFlight ??= (async () => {
      try {
        const refreshToken = authState.tokens()?.refreshToken;
        if (!refreshToken) return null;

        // Bypasses `this.instance` so a 401 here cannot re-enter the interceptor.
        const { data } = await axios.post<AuthTokens>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { accept: 'application/json' } },
        );
        authState.setTokens(data);
        return data;
      } catch {
        authState.clear();
        this.onUnauthorized?.();
        return null;
      } finally {
        // Cleared in a microtask so every awaiter observes the same result first.
        queueMicrotask(() => {
          this.refreshInFlight = null;
        });
      }
    })();

    return this.refreshInFlight;
  }
}

export const http = new HttpClient();
