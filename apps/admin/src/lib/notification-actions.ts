"use server";

import type { CreateNotificationCampaignInput } from "@fitness/validation";
import { revalidatePath } from "next/cache";

import { apiFetch } from "./api";

export async function createNotificationAction(
  data: CreateNotificationCampaignInput,
) {
  await apiFetch("/notifications", {
    method: "POST",
    body: JSON.stringify(data),
  });
  revalidatePath("/notifications");
  return { success: true };
}

export async function cancelNotificationAction(id: string) {
  await apiFetch(`/notifications/${id}/cancel`, { method: "POST" });
  revalidatePath("/notifications");
  revalidatePath(`/notifications/${id}`);
  return { success: true };
}
