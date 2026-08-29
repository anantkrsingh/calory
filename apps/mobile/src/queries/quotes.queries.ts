import type { DailyQuote } from '@fitness/types';
import {
  queryOptions,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import { quotesService } from '@/services/quotes.service';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

export class QuotesQueries {
  static readonly root = ['quotes'] as const;

  static keys = {
    all: QuotesQueries.root,
    today: () => [...QuotesQueries.root, 'today'] as const,
  };

  static today(enabled: boolean) {
    return queryOptions({
      queryKey: QuotesQueries.keys.today(),
      queryFn: () => quotesService.today(),
      enabled,
      // Quotes rotate once a day — avoid refetching on every focus.
      staleTime: 60 * 60 * 1000,
    });
  }
}

export function useTodayQuote(): UseQueryResult<DailyQuote> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(QuotesQueries.today(isAuthenticated));
}
