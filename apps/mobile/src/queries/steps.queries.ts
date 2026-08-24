import type { DailySteps, IsoDate, StepsSummary } from '@fitness/types';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { stepsService } from '@/services/steps.service';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

export class StepsQueries {
  static readonly root = ['steps'] as const;

  static keys = {
    all: StepsQueries.root,
    day: (date: IsoDate) => [...StepsQueries.root, 'day', date] as const,
    range: (from: IsoDate, to: IsoDate) =>
      [...StepsQueries.root, 'range', from, to] as const,
  };

  static day(enabled: boolean, date: IsoDate) {
    return queryOptions({
      queryKey: StepsQueries.keys.day(date),
      queryFn: () => stepsService.get(date),
      enabled,
      staleTime: 60 * 1000,
    });
  }

  static range(enabled: boolean, from: IsoDate, to: IsoDate) {
    return queryOptions({
      queryKey: StepsQueries.keys.range(from, to),
      queryFn: () => stepsService.range(from, to),
      enabled,
      staleTime: 5 * 60 * 1000,
    });
  }
}

export function useDailySteps(date: IsoDate): UseQueryResult<StepsSummary> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(StepsQueries.day(isAuthenticated, date));
}

export function useStepsRange(
  from: IsoDate,
  to: IsoDate,
): UseQueryResult<DailySteps[]> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(StepsQueries.range(isAuthenticated, from, to));
}

export function useUpsertSteps(): UseMutationResult<
  DailySteps,
  Error,
  { date: IsoDate; steps: number }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, steps }) => stepsService.upsert(date, steps),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: StepsQueries.keys.all });
    },
  });
}
