import type { AppSettings } from "@fitness/types";
import type { Metadata } from "next";

import { apiFetch } from "@/lib/api";

import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings — Fitness Admin" };

export default async function SettingsPage() {
  const settings = await apiFetch<AppSettings>("/settings");

  return (
    <div className="max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-semibold text-neutral-900">Settings</h1>
      <SettingsForm initial={{ freeChatsLimit: settings.freeChatsLimit, aiPrompts: settings.aiPrompts }} />
    </div>
  );
}
