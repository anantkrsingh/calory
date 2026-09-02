import type { DietPlan, IsoDate, TodayDiet } from '@fitness/types';
import type { MarkDietItemsTakenInput } from '@fitness/validation';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { dietPlansService } from '@/services/diet-plans.service';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

export class DietPlansQueries {
  static readonly root = ['diet-plans'] as const;

  static keys = {
    all: DietPlansQueries.root,
    me: () => [...DietPlansQueries.root, 'me'] as const,
    today: (date: IsoDate) => [...DietPlansQueries.root, 'today', date] as const,
  };

  static me(enabled: boolean) {
    return queryOptions({
      queryKey: DietPlansQueries.keys.me(),
      queryFn: () => dietPlansService.me(),
      enabled,
      staleTime: 5 * 60 * 1000,
    });
  }

  static today(enabled: boolean, date: IsoDate) {
    return queryOptions({
      queryKey: DietPlansQueries.keys.today(date),
      queryFn: () => dietPlansService.today(date),
      enabled,
      staleTime: 30 * 1000,
      // Poll while the plan is still generating, so the loading state clears
      // on its own once it's ready instead of waiting for the next reopen.
      refetchInterval: (query) =>
        query.state.data?.planStatus === 'generating' ? 4000 : false,
    });
  }
}

export function useDietPlan(): UseQueryResult<DietPlan> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(DietPlansQueries.me(isAuthenticated));
}

/** Today's meals layered with what's actually been taken — the diet screen's
 * main data source. */
export function useTodayDiet(date: IsoDate): UseQueryResult<TodayDiet> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(DietPlansQueries.today(isAuthenticated, date));
}

/** Also the "Create my diet plan" action — there's no auto-generated plan to
 * start from, so first-time creation and regeneration are the same call. */
export function useRegenerateDietPlan(): UseMutationResult<DietPlan, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dietPlansService.regenerate(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DietPlansQueries.root });
    },
  });
}

type MarkDietItemsTakenVariables = {
  date: IsoDate;
  input: MarkDietItemsTakenInput;
};

export function useMarkDietItemsTaken(): UseMutationResult<
  TodayDiet,
  Error,
  MarkDietItemsTakenVariables
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, input }: MarkDietItemsTakenVariables) =>
      dietPlansService.markTaken(date, input),
    onSuccess: (data, { date }) => {
      queryClient.setQueryData(DietPlansQueries.keys.today(date), data);
    },
  });
}
