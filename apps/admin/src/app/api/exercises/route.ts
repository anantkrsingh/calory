import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ApiError, apiFetch } from "@/lib/api";

/**
 * Thin same-origin proxy in front of the backend `/exercises` endpoint. The
 * client calls this route directly (via TanStack Query) instead of a Server
 * Action — `apiFetch` still runs server-side here, so the httpOnly session
 * cookie is never exposed to the browser.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  try {
    const exercise = await apiFetch("/exercises", { method: "POST", body });
    return NextResponse.json(exercise);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}
