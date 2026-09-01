export class ClientApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

/**
 * Browser-side fetch wrapper for this app's own `/api/*` route handlers.
 * Those run server-side and hold the httpOnly session cookie, so the
 * browser never needs the backend access token directly — this just talks
 * to same-origin routes, unlike `lib/api.ts`'s `apiFetch`, which is
 * server-only (it reads the cookie via `next/headers`).
 */
export async function apiRequest<T = void>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ClientApiError(response.status, body?.message ?? `Request failed with ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
