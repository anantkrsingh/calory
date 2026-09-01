import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UploadSignature } from "@fitness/validation";

import { ApiError, apiFetch } from "@/lib/api";

/**
 * Signs Cloudinary upload params server-side (the httpOnly session cookie
 * never reaches the browser) so the client can then POST the file straight
 * to Cloudinary — the image bytes never pass through this server.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  try {
    const signature = await apiFetch<UploadSignature>("/uploads/signature", {
      method: "POST",
      body: body || "{}",
    });
    return NextResponse.json(signature);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}
