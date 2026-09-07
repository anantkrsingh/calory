import type { CalorieBalance, IsoDate } from '@fitness/types';
import { queryOptions, useQuery, type UseQueryResult } from '@tanstack/react-query';

import { caloriesService } from '@/services/calories.service';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

export class CaloriesQueries {
  static readonly root = ['calories'] as const;

  static keys = {
    all: CaloriesQueries.root,
    day: (date: IsoDate) => [...CaloriesQueries.root, 'day', date] as const,
    range: (from: IsoDate, to: IsoDate) =>
      [...CaloriesQueries.root, 'range', from, to] as const,
  };

  static day(enabled: boolean, date: IsoDate) {
    return queryOptions({
      queryKey: CaloriesQueries.keys.day(date),
      queryFn: () => caloriesService.today(date),
      enabled,
      staleTime: 60 * 1000,
    });
  }

  static range(enabled: boolean, from: IsoDate, to: IsoDate) {
    return queryOptions({
      queryKey: CaloriesQueries.keys.range(from, to),
      queryFn: () => caloriesService.range(from, to),
      enabled,
      staleTime: 5 * 60 * 1000,
    });
  }
}

export function useCalorieBalance(date: IsoDate): UseQueryResult<CalorieBalance> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(CaloriesQueries.day(isAuthenticated, date));
}

export function useCalorieRange(
  from: IsoDate,
  to: IsoDate,
): UseQueryResult<CalorieBalance[]> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(CaloriesQueries.range(isAuthenticated, from, to));
}
