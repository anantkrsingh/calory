import type { Citation } from '@fitness/types';

const TAVILY_API_URL = 'https://api.tavily.com/search';

interface TavilyResult {
  title?: string;
  url?: string;
}

interface TavilyResponse {
  results?: TavilyResult[];
}

/**
 * One Tavily search — a plain REST call, not an LLM tool. Unlike
 * `google.tools.googleSearch`/`openai.tools.webSearch` (only invokable
 * through a model's own tool-calling, so the model has to "decide" to
 * search), this always runs: citations no longer hinge on the model's
 * discretion, only on whether `TAVILY_API_KEY` is configured.
 */
async function tavilySearch(
  apiKey: string,
  query: string,
  maxResults: number,
): Promise<Citation[]> {
  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: maxResults,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `${response.status} ${response.statusText}${body ? `: ${body.slice(0, 300)}` : ''}`,
    );
  }

  const data = (await response.json()) as TavilyResponse;
  return (data.results ?? [])
    .filter((result): result is TavilyResult & { url: string } => !!result.url)
    .map((result) => ({
      title: result.title?.trim() || result.url,
      url: result.url,
    }));
}

/**
 * Runs several Tavily queries and returns the combined, deduped results
 * (capped at `maxTotal`) — the real source material a diet plan's meals
 * cite from. One query failing (a network hiccup, a bad response) is
 * logged and skipped rather than failing the whole generation; an empty
 * result set just means the plan generates with no citations that round.
 */
export async function tavilySearchMany({
  apiKey,
  queries,
  maxResultsPerQuery = 4,
  maxTotal = 12,
  log,
}: {
  apiKey: string;
  queries: string[];
  maxResultsPerQuery?: number;
  maxTotal?: number;
  log: (message: string) => void;
}): Promise<Citation[]> {
  const byUrl = new Map<string, Citation>();

  for (const query of queries) {
    if (byUrl.size >= maxTotal) break;

    try {
      const results = await tavilySearch(apiKey, query, maxResultsPerQuery);
      for (const citation of results) {
        if (byUrl.has(citation.url)) continue;
        byUrl.set(citation.url, citation);
        if (byUrl.size >= maxTotal) break;
      }
      log(`Tavily search "${query}" — ${results.length} result(s)`);
    } catch (error) {
      log(
        `Tavily search "${query}" failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return Array.from(byUrl.values());
}
