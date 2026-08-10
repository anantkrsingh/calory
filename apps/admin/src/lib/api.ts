import { cookies } from "next/headers";

import { SESSION_COOKIE } from "./session";

const API_BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:3000/api/v1").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Server-only fetch wrapper for the backend API. Reads the admin's access
 * token from the httpOnly session cookie and attaches it as a bearer token —
 * the backend has no concept of cookies, so this is the one place that
 * bridges the two.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.message ?? `Request failed with ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Same as `apiFetch`, but for the unauthenticated login call — no cookie to read. */
export async function apiFetchPublic<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.message ?? `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}
