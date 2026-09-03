import type { ApiErrorBody } from '@fitness/types';
import { isAxiosError } from 'axios';

/** A non-2xx response that carried (or was coerced into) the API error shape. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;
  readonly details: Record<string, string[]>;
  /**
   * Whether `message` actually came from the API's own JSON error body, as
   * opposed to a synthesized "request failed with <status>" fallback. A
   * gateway/proxy failure (502, 504, an HTML maintenance page) never reaches
   * our exception filter, so there's no real message to show — just a
   * status code, which reads as an internal detail, not something a user
   * should see. `getErrorMessage` uses this to fall back to the caller's
   * own copy instead.
   */
  readonly hasServerMessage: boolean;

  constructor(
    status: number,
    message: string,
    body: ApiErrorBody | null,
    hasServerMessage: boolean,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.details = body?.details ?? {};
    this.hasServerMessage = hasServerMessage;
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

  get isPaymentRequired(): boolean {
    return this.status === 402;
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
  // A synthesized "request failed with <status>" — see `hasServerMessage` —
  // is an internal detail (a URL path, an HTTP status code), not something
  // to show a user; the caller's own fallback copy is more honest here.
  if (isApiError(error) && !error.hasServerMessage) return fallback;

  if (error instanceof Error) {
    const message = error.message.trim();
    if (message.length > 0) return message;
  }
  return fallback;
}

/**
 * The AI SDK chat transport doesn't go through axios/`normaliseError` — a
 * non-2xx response is thrown as `new Error(await response.text())` (see
 * `DefaultChatTransport`), so `error.message` is often the raw `ApiErrorBody`
 * JSON rather than a plain sentence. Unwrap it the same way `messageFromBody`
 * does for axios failures, so a failed send reads as a message, not
 * `{"statusCode":402,"message":"..."}`.
 */
export function getChatErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const raw = error.message.trim();
  if (!raw) return fallback;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && 'message' in parsed) {
      const { message } = parsed as ApiErrorBody;
      const text = Array.isArray(message) ? message.join(', ') : String(message);
      return text.trim() || fallback;
    }
  } catch {
    // Not JSON — fall through to the markup/length guard below.
  }

  // A downed server/proxy (a 502/504, a maintenance page) answers with an
  // HTML error page rather than JSON — that's not a message, it's markup, so
  // showing it raw would dump the whole page into the chat. Anything that
  // isn't plainly a short sentence gets the fallback instead.
  const looksLikeMarkup = /^\s*</.test(raw);
  if (looksLikeMarkup || raw.length > 300) return fallback;

  return raw;
}

/** True for our own API's JSON error shape — false for a gateway/proxy
 * failure (502, 504, an HTML maintenance page), whose body is either not an
 * object at all or an object with no `message`. */
function hasMessageField(body: unknown): body is ApiErrorBody {
  return body !== null && typeof body === 'object' && 'message' in body;
}

function messageFromBody(body: unknown, status: number, url: string): string {
  if (hasMessageField(body)) {
    const { message } = body;
    return Array.isArray(message) ? message.join(', ') : String(message);
  }
  return `Request to ${url} failed with ${status}`;
}

/**
 * Collapses every axios failure mode into one of our three error classes, so
 * screens can branch on `isApiError(e) && e.isValidationError` and never have
 * to reason about axios internals.
 */
export function normaliseError(error: unknown): Error {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error : new Error(String(error));
  }

  const url = error.config?.url ?? 'the API';

  if (error.response) {
    const body = error.response.data;
    const isErrorBody = hasMessageField(body);
    return new ApiError(
      error.response.status,
      messageFromBody(body, error.response.status, url),
      isErrorBody ? body : null,
      isErrorBody,
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
