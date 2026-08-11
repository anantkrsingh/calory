"use server";

import type { CreatePlanInput, UpdatePlanInput } from "@fitness/validation";
import { revalidatePath } from "next/cache";

import { apiFetch } from "./api";

export async function createPlanAction(data: CreatePlanInput) {
  await apiFetch("/plans", {
    method: "POST",
    body: JSON.stringify(data),
  });
  revalidatePath("/plans");
  return { success: true };
}

export async function updatePlanAction(id: string, data: UpdatePlanInput) {
  await apiFetch(`/plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  revalidatePath("/plans");
  return { success: true };
}

export async function deletePlanAction(id: string) {
  await apiFetch(`/plans/${id}`, {
    method: "DELETE",
  });
  revalidatePath("/plans");
  return { success: true };
}
