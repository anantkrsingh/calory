"use client";

import type { AiPromptConfig } from "@fitness/types";
import { useActionState, useState } from "react";

import { updateSettingsAction, type SettingsState } from "./actions";

const initialState: SettingsState = {};

export function SettingsForm({
  initial,
}: {
  initial: { freeChatsLimit: number; aiPrompts: AiPromptConfig[] };
}) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initialState);
  const [prompts, setPrompts] = useState<AiPromptConfig[]>(initial.aiPrompts);

  const addPrompt = () => setPrompts((current) => [...current, { key: "", label: "", prompt: "" }]);
  const removePrompt = (index: number) =>
    setPrompts((current) => current.filter((_, i) => i !== index));
  const updatePrompt = (index: number, field: keyof AiPromptConfig, value: string) =>
    setPrompts((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <section>
        <h2 className="mb-1 text-sm font-semibold text-neutral-900">Free AI chats per user</h2>
        <p className="mb-3 text-sm text-neutral-500">
          How many AI-generated chat responses a user gets before hitting the paywall.
        </p>
        <input
          type="number"
          name="freeChatsLimit"
          min={0}
          defaultValue={initial.freeChatsLimit}
          className="w-32 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">AI prompts</h2>
            <p className="text-sm text-neutral-500">The system prompt used for each AI-driven feature.</p>
          </div>
          <button
            type="button"
            onClick={addPrompt}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
          >
            Add prompt
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {prompts.map((prompt, index) => (
            <div key={index} className="rounded-xl border border-neutral-200 p-4">
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-neutral-500">Key</label>
                  <input
                    value={prompt.key}
                    onChange={(event) => updatePrompt(index, "key", event.target.value)}
                    placeholder="workout_suggestion"
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-neutral-500">Label</label>
                  <input
                    value={prompt.label}
                    onChange={(event) => updatePrompt(index, "label", event.target.value)}
                    placeholder="Workout suggestion"
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Prompt</label>
              <textarea
                value={prompt.prompt}
                onChange={(event) => updatePrompt(index, "prompt", event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
              <button
                type="button"
                onClick={() => removePrompt(index)}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          {prompts.length === 0 ? (
            <p className="text-sm text-neutral-500">No prompts configured yet.</p>
          ) : null}
        </div>
      </section>

      <input type="hidden" name="aiPrompts" value={JSON.stringify(prompts)} />

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">Settings saved.</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
