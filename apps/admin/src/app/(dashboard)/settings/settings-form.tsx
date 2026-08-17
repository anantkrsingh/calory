"use client";

import {
  PROMPT_CATEGORIES,
  PROMPT_CATEGORY_LABELS,
} from "@fitness/ai";
import type { AiPromptConfig, PromptCategory } from "@fitness/types";
import { PromptCategory as PromptCategories } from "@fitness/types";
import { Settings2, X } from "lucide-react";
import { useActionState, useState } from "react";

import { CustomDropdown } from "@/components/custom-dropdown";
import { updateSettingsAction, type SettingsState } from "./actions";

const initialState: SettingsState = {};

const CATEGORY_OPTIONS = PROMPT_CATEGORIES.map((value) => ({
  value,
  label: PROMPT_CATEGORY_LABELS[value],
}));

function buildInitialPrompts(configured: AiPromptConfig[]): AiPromptConfig[] {
  return PROMPT_CATEGORIES.map((promptCategory) => {
    const existing = configured.find((entry) => entry.promptCategory === promptCategory);
    return {
      promptCategory,
      prompt: existing?.prompt ?? "",
    };
  });
}

export function SettingsForm({
  initial,
}: {
  initial: { freeChatsLimit: number; aiPrompts: AiPromptConfig[] };
}) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initialState);
  const [prompts, setPrompts] = useState<AiPromptConfig[]>(() =>
    buildInitialPrompts(initial.aiPrompts),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftPrompts, setDraftPrompts] = useState<AiPromptConfig[]>(prompts);
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>(
    PromptCategories.QuoteOfTheDay,
  );

  const selectedDraft =
    draftPrompts.find((entry) => entry.promptCategory === selectedCategory) ??
    draftPrompts[0];

  const openModal = () => {
    setDraftPrompts(prompts);
    setSelectedCategory(prompts[0]?.promptCategory ?? PromptCategories.QuoteOfTheDay);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const applyModal = () => {
    setPrompts(draftPrompts);
    setIsModalOpen(false);
  };

  const updateSelectedPrompt = (prompt: string) => {
    setDraftPrompts((current) =>
      current.map((item) =>
        item.promptCategory === selectedCategory ? { ...item, prompt } : item,
      ),
    );
  };

  return (
    <>
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
            className="w-32 cursor-text rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900"
          />
        </section>

        <section>
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">AI prompts</h2>
              <p className="text-sm text-neutral-500">
                System prompts for each AI feature. Leave blank to use the built-in fallback.
              </p>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              <Settings2 size={16} />
              Configure
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {prompts.map((entry) => {
              const isCustom = entry.prompt.trim().length > 0;
              return (
                <div
                  key={entry.promptCategory}
                  className="flex items-center justify-between gap-4 border-b border-neutral-100 px-4 py-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {PROMPT_CATEGORY_LABELS[entry.promptCategory]}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {isCustom ? "Custom prompt configured" : "Using built-in fallback"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      isCustom
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {isCustom ? "Custom" : "Fallback"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <input type="hidden" name="aiPrompts" value={JSON.stringify(prompts)} />

        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-600">Settings saved.</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-fit cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </form>

      {isModalOpen && selectedDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-neutral-900">Configure AI prompt</h2>
              <button
                type="button"
                onClick={closeModal}
                className="cursor-pointer rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-700">Category</label>
                <CustomDropdown
                  options={CATEGORY_OPTIONS}
                  value={selectedCategory}
                  onChange={(value) => setSelectedCategory(value as PromptCategory)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-700">Prompt</label>
                <textarea
                  value={selectedDraft.prompt}
                  onChange={(event) => updateSelectedPrompt(event.target.value)}
                  rows={8}
                  className="w-full cursor-text rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="cursor-pointer rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyModal}
                className="cursor-pointer rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
