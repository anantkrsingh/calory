"use server";

import type { CreateExerciseInput, UpdateExerciseInput, UploadSignature } from "@fitness/validation";
import { revalidatePath } from "next/cache";

import { apiFetch } from "./api";

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

/**
 * Signs Cloudinary upload params so the browser can POST the file straight
 * to Cloudinary — the image bytes never pass through this server or the API.
 */
export async function getUploadSignatureAction(folder?: string): Promise<UploadSignature> {
  return apiFetch<UploadSignature>("/uploads/signature", {
    method: "POST",
    body: JSON.stringify(folder ? { folder } : {}),
  });
}
