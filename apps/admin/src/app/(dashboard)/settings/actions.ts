"use server";

import type { AppSettings } from "@fitness/types";
import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "@/lib/api";

export interface SettingsState {
  error?: string;
  success?: boolean;
}

export async function updateSettingsAction(
  _prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const freeChatsLimit = Number(formData.get("freeChatsLimit"));
  const aiPromptsRaw = String(formData.get("aiPrompts") ?? "[]");

  let aiPrompts: unknown;
  try {
    aiPrompts = JSON.parse(aiPromptsRaw);
  } catch {
    return { error: "Invalid prompts payload." };
  }

  // Blank fields are stripped client-side, so an all-defaults config arrives
  // as an object of undefineds — send it as `undefined` rather than empty keys.
  let calorieConfig: unknown;
  const calorieConfigRaw = formData.get("calorieConfig");
  if (calorieConfigRaw) {
    try {
      calorieConfig = JSON.parse(String(calorieConfigRaw));
    } catch {
      return { error: "Invalid calorie config payload." };
    }
  }

  try {
    await apiFetch<AppSettings>("/settings", {
      method: "PATCH",
      body: JSON.stringify({ freeChatsLimit, aiPrompts, calorieConfig }),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Could not save settings." };
  }

  revalidatePath("/settings");
  return { success: true };
}
