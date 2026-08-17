import type { ApiErrorBody } from '@fitness/types';
import axios from 'axios';

/** A non-2xx response that carried (or was coerced into) the API error shape. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;
  readonly details: Record<string, string[]>;

  constructor(status: number, message: string, body: ApiErrorBody | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.details = body?.details ?? {};
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }

  /** First message for a field, for inline form errors. */
  fieldError(field: string): string | undefined {
    return this.details[field]?.[0];
  }
}

/** The request never reached the API — offline, DNS failure, TLS error. */
export class NetworkError extends Error {
  override readonly cause: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

/** The request exceeded the configured timeout and was aborted client-side. */
export class TimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

export const isNetworkError = (error: unknown): error is NetworkError =>
  error instanceof NetworkError;

export const isTimeoutError = (error: unknown): error is TimeoutError =>
  error instanceof TimeoutError;

/** Prefer the server/error message; fall back when nothing useful is present. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message.length > 0) return message;
  }
  return fallback;
}

function messageFromBody(body: unknown, status: number, url: string): string {
  if (body !== null && typeof body === 'object' && 'message' in body) {
    const { message } = body as ApiErrorBody;
    return Array.isArray(message)
      ? (message as string[]).join(', ')
      : String(message);
  }
  return `Request to ${url} failed with ${status}`;
}

/**
 * Collapses every axios failure mode into one of our three error classes, so
 * screens can branch on `isApiError(e) && e.isValidationError` and never have
 * to reason about axios internals.
 */
export function normaliseError(error: unknown): Error {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error(String(error));
  }

  const url = error.config?.url ?? 'the API';

  if (error.response) {
    const body = error.response.data;
    const isErrorBody = body !== null && typeof body === 'object';
    return new ApiError(
      error.response.status,
      messageFromBody(body, error.response.status, url),
      isErrorBody ? (body as ApiErrorBody) : null,
    );
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new TimeoutError(error.config?.timeout ?? 0);
  }

  // A caller-supplied AbortSignal fired — surface it untouched so react-query
  // recognises the cancellation instead of retrying it as a network blip.
  if (error.code === 'ERR_CANCELED') {
    return error;
  }

  return new NetworkError(error.message || 'Network request failed', error);
}
