"use client";

import {
  LLM_MODEL_CATALOG,
  LLM_PROVIDER_ICONS,
  LLM_PROVIDER_LABELS,
  LLM_PROVIDERS,
  PROMPT_CATEGORIES,
  PROMPT_CATEGORY_LABELS,
} from "@fitness/ai";
import type { AiPromptConfig, CalorieConfig, LlmProvider, PromptCategory } from "@fitness/types";
import { PromptCategory as PromptCategories } from "@fitness/types";
import { Settings2, X } from "lucide-react";
import { useActionState, useState } from "react";

import { CustomDropdown, type CustomDropdownOption } from "@/components/custom-dropdown";
import { CalorieConfigFields } from "./calorie-config-fields";
import { updateSettingsAction, type SettingsState } from "./actions";

const initialState: SettingsState = {};

const CATEGORY_OPTIONS = PROMPT_CATEGORIES.map((value) => ({
  value,
  label: PROMPT_CATEGORY_LABELS[value],
}));

const SERVER_DEFAULT = "";
const CUSTOM_MODEL = "__custom__";

const PROVIDER_OPTIONS: CustomDropdownOption[] = [
  { value: SERVER_DEFAULT, label: "Server default" },
  ...LLM_PROVIDERS.map((provider) => ({
    value: provider,
    label: LLM_PROVIDER_LABELS[provider],
    icon: LLM_PROVIDER_ICONS[provider],
  })),
];

function modelOptionsFor(provider: LlmProvider): CustomDropdownOption[] {
  return [
    ...LLM_MODEL_CATALOG[provider].map((entry) => ({
      value: entry.id,
      label: entry.label,
    })),
    { value: CUSTOM_MODEL, label: "Custom model id…" },
  ];
}

function buildInitialPrompts(configured: AiPromptConfig[]): AiPromptConfig[] {
  return PROMPT_CATEGORIES.map((promptCategory) => {
    const existing = configured.find((entry) => entry.promptCategory === promptCategory);
    return {
      promptCategory,
      prompt: existing?.prompt ?? "",
      provider: existing?.provider,
      model: existing?.model,
    };
  });
}

export function SettingsForm({
  initial,
}: {
  initial: {
    freeChatsLimit: number;
    aiPrompts: AiPromptConfig[];
    calorieConfig?: CalorieConfig;
  };
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
  // Whether the model field is showing the freeform text input — set whenever
  // the stored model isn't one of the current provider's catalog entries.
  const [customModelEntry, setCustomModelEntry] = useState(false);

  const selectedDraft =
    draftPrompts.find((entry) => entry.promptCategory === selectedCategory) ??
    draftPrompts[0];

  const openModal = () => {
    setDraftPrompts(prompts);
    const firstCategory = prompts[0]?.promptCategory ?? PromptCategories.QuoteOfTheDay;
    setSelectedCategory(firstCategory);
    const first = prompts.find((entry) => entry.promptCategory === firstCategory);
    setCustomModelEntry(
      Boolean(
        first?.provider &&
          first.model &&
          !LLM_MODEL_CATALOG[first.provider].some((entry) => entry.id === first.model),
      ),
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const applyModal = () => {
    setPrompts(draftPrompts);
    setIsModalOpen(false);
  };

  const selectCategory = (category: PromptCategory) => {
    setSelectedCategory(category);
    const entry = draftPrompts.find((item) => item.promptCategory === category);
    setCustomModelEntry(
      Boolean(
        entry?.provider &&
          entry.model &&
          !LLM_MODEL_CATALOG[entry.provider].some((option) => option.id === entry.model),
      ),
    );
  };

  const updateSelectedPrompt = (prompt: string) => {
    setDraftPrompts((current) =>
      current.map((item) =>
        item.promptCategory === selectedCategory ? { ...item, prompt } : item,
      ),
    );
  };

  const updateSelectedProvider = (value: string) => {
    const provider = value === SERVER_DEFAULT ? undefined : (value as LlmProvider);
    setCustomModelEntry(false);
    setDraftPrompts((current) =>
      current.map((item) =>
        item.promptCategory === selectedCategory
          ? { ...item, provider, model: undefined }
          : item,
      ),
    );
  };

  const updateSelectedModel = (value: string) => {
    if (value === CUSTOM_MODEL) {
      setCustomModelEntry(true);
      setDraftPrompts((current) =>
        current.map((item) =>
          item.promptCategory === selectedCategory ? { ...item, model: "" } : item,
        ),
      );
      return;
    }
    setDraftPrompts((current) =>
      current.map((item) =>
        item.promptCategory === selectedCategory ? { ...item, model: value } : item,
      ),
    );
  };

  return (
    <>
      <form action={formAction} className="flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
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
            className="w-full max-w-[12rem] cursor-text rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900"
          />
        </section>

        <section>
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">AI prompts &amp; models</h2>
              <p className="text-sm text-neutral-500">
                Per-feature system prompt and LLM. Leave on server default to use the
                built-in fallback and the LLM_PROVIDER/LLM_MODEL env vars.
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
              const isCustomPrompt = entry.prompt.trim().length > 0;
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
                      {isCustomPrompt ? "Custom prompt configured" : "Using built-in fallback"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.provider ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700">
                        <img
                          src={LLM_PROVIDER_ICONS[entry.provider]}
                          alt=""
                          className="h-3.5 w-3.5"
                        />
                        {entry.model ?? "default model"}
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                        Server default
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        </div>

        <CalorieConfigFields initial={initial.calorieConfig} />

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
              <h2 className="text-lg font-semibold text-neutral-900">Configure AI feature</h2>
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
                  onChange={(value) => selectCategory(value as PromptCategory)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-700">Model provider</label>
                  <CustomDropdown
                    options={PROVIDER_OPTIONS}
                    value={selectedDraft.provider ?? SERVER_DEFAULT}
                    onChange={updateSelectedProvider}
                    placeholder="Server default"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-700">Model</label>
                  {!selectedDraft.provider ? (
                    <div className="flex h-[42px] items-center rounded-xl border border-dashed border-neutral-200 px-3.5 text-xs text-neutral-400">
                      Pick a provider first
                    </div>
                  ) : customModelEntry ? (
                    <input
                      type="text"
                      value={selectedDraft.model ?? ""}
                      onChange={(event) => updateSelectedModel(event.target.value)}
                      placeholder="e.g. gpt-4.1-nano"
                      className="w-full cursor-text rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                    />
                  ) : (
                    <CustomDropdown
                      options={modelOptionsFor(selectedDraft.provider)}
                      value={selectedDraft.model ?? ""}
                      onChange={updateSelectedModel}
                      placeholder="Provider default"
                    />
                  )}
                </div>
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
