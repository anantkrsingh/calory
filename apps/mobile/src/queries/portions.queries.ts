import type { PortionFood } from '@fitness/types';
import { queryOptions, useQuery, type UseQueryResult } from '@tanstack/react-query';

import { portionsService } from '@/services/portions.service';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

export class PortionsQueries {
  static readonly root = ['portions'] as const;

  static keys = {
    all: PortionsQueries.root,
    list: () => [...PortionsQueries.root, 'list'] as const,
  };

  static list(enabled: boolean) {
    return queryOptions({
      queryKey: PortionsQueries.keys.list(),
      queryFn: () => portionsService.list(),
      enabled,
      // An admin-curated catalogue barely changes; no need to refetch often.
      staleTime: 60 * 60 * 1000,
    });
  }
}

export function usePortionFoods(): UseQueryResult<PortionFood[]> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(PortionsQueries.list(isAuthenticated));
}
