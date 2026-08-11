"use server";

import type { AdminUpdateUserInput } from "@fitness/validation";
import { revalidatePath } from "next/cache";

import { apiFetch } from "./api";

export async function updateUserAction(id: string, data: AdminUpdateUserInput) {
  await apiFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  revalidatePath("/users");
  return { success: true };
}
