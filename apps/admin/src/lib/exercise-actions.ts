"use server";

import type { CreateExerciseInput, UpdateExerciseInput, UploadedImage } from "@fitness/validation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "./api";
import { SESSION_COOKIE } from "./session";

const API_BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:3000/api/v1").replace(
  /\/+$/,
  "",
);

export async function createExerciseAction(data: CreateExerciseInput) {
  await apiFetch("/exercises", {
    method: "POST",
    body: JSON.stringify(data),
  });
  revalidatePath("/exercises");
  return { success: true };
}

export async function updateExerciseAction(id: string, data: UpdateExerciseInput) {
  await apiFetch(`/exercises/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  revalidatePath("/exercises");
  return { success: true };
}

export async function deleteExerciseAction(id: string) {
  await apiFetch(`/exercises/${id}`, {
    method: "DELETE",
  });
  revalidatePath("/exercises");
  return { success: true };
}

/** Uploads an image file to Cloudinary via the API. Field name must be `file`. */
export async function uploadImageAction(formData: FormData): Promise<UploadedImage> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const response = await fetch(`${API_BASE_URL}/uploads/image`, {
    method: "POST",
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? `Upload failed with ${response.status}`);
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as UploadedImage;
}
