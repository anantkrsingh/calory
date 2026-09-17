import type { Citation } from '@fitness/types';
import { generateText, stepCountIs, type LanguageModel } from 'ai';

import type { AiSearchToolResolver } from './ai.module';


const MAX_CITATION_SOURCES = 12;


export function dedupeSources(sources: readonly unknown[]): Citation[] {
  const byUrl = new Map<string, Citation>();
  for (const source of sources) {
    if (typeof source !== 'object' || source === null) continue;
    const { sourceType, url, title } = source as Record<string, unknown>;
    if (sourceType !== 'url' || typeof url !== 'string' || byUrl.has(url)) {
      continue;
    }
    byUrl.set(url, {
      title: typeof title === 'string' && title.trim() ? title.trim() : url,
      url,
    });
    if (byUrl.size >= MAX_CITATION_SOURCES) break;
  }
  return Array.from(byUrl.values());
}


export async function searchWithRetry({
  model,
  searchTool,
  basePrompt,
  tag,
  log,
}: {
  model: LanguageModel;
  searchTool: NonNullable<ReturnType<AiSearchToolResolver>>;
  basePrompt: string;
  tag: string;
  log: (message: string) => void;
}): Promise<Citation[]> {
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const run = await generateText({
      model,
      prompt:
        attempt === 1
          ? basePrompt
          : `${basePrompt} Important: you must actually call webSearch at ` +
          'least once before responding — do not answer without it.',
      tools: { webSearch: searchTool },
      stopWhen: stepCountIs(3),
      providerOptions: { openai: { reasoningEffort: 'low' } },
    });

    const sources = dedupeSources(run.steps.flatMap((step) => step.sources));
    log(
      `${tag}: search attempt ${attempt}/${maxAttempts} — ${run.steps.length} step(s), ` +
      `${sources.length} source(s), ${run.usage?.totalTokens ?? '?'} tokens`,
    );
    if (sources.length > 0) return sources;
  }

  log(
    `${tag}: search returned no groundable sources after ${maxAttempts} ` +
    'attempts (this will be sparse; there is no API-level way to force ' +
    'grounding, only prompting toward it)',
  );
  return [];
}
