import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Paginated, User } from "@fitness/types";

import { ApiError, apiFetch } from "@/lib/api";

/**
 * Thin same-origin proxy in front of `/users`, for the notification
 * recipient picker's type-ahead — client-side `fetch` needs a same-origin
 * route since `apiFetch` (and the session cookie it reads) is server-only.
 */
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search")?.trim();
  const params = new URLSearchParams({ page: "1", limit: "20" });
  if (search) params.set("search", search);

  try {
    const result = await apiFetch<Paginated<User>>(`/users?${params.toString()}`);
    const users = result.items.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.profile.displayName,
    }));
    return NextResponse.json(users);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}
