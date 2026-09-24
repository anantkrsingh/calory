import type { DietPlan, IsoDate, TodayDiet } from '@fitness/types';
import type {
  GenerateDietPlanInput,
  LogPortionInput,
  MarkDietItemsTakenInput,
} from '@fitness/validation';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { dietPlansService } from '@/services/diet-plans.service';

import { CaloriesQueries } from './calories.queries';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

function shouldPollGeneratingPlan(query: {
  state: {
    data?: TodayDiet;
  };
}) {
  return query.state.data?.planStatus === 'generating' ? 4000 : false;
}

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
      // This only runs after a successful response says `generating`; failed
      // server-down responses do not retry below.
      retry: false,
      refetchInterval: shouldPollGeneratingPlan,
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
 * start from, so first-time creation and regeneration are the same call.
 * `input` carries the preferences collected from the user (diet types,
 * cuisine, exclusions, meals per day); every field is optional. */
export function useRegenerateDietPlan(): UseMutationResult<
  DietPlan,
  Error,
  GenerateDietPlanInput | undefined
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: GenerateDietPlanInput) =>
      dietPlansService.regenerate(input ?? undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DietPlansQueries.root });
    },
  });
}

type MarkDietItemsTakenVariables = {
  date: IsoDate;
  input: MarkDietItemsTakenInput;
};

type MarkDietItemsTakenContext = {
  previous?: TodayDiet;
};

function optimisticTakenItemIds(
  current: TodayDiet,
  input: MarkDietItemsTakenInput,
): string[] {
  const ids = new Set(current.takenItemIds);
  const meal = current.day?.meals.find(
    (candidate) => candidate.id === input.mealId,
  );
  const targetIds = input.itemId
    ? [input.itemId]
    : (meal?.items.map((item) => item.id) ?? []);

  for (const id of targetIds) {
    if (input.taken) ids.add(id);
    else ids.delete(id);
  }

  return Array.from(ids);
}

export function useMarkDietItemsTaken(): UseMutationResult<
  TodayDiet,
  Error,
  MarkDietItemsTakenVariables
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, input }: MarkDietItemsTakenVariables) =>
      dietPlansService.markTaken(date, input),
    onMutate: async ({ date, input }) => {
      const queryKey = DietPlansQueries.keys.today(date);
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<TodayDiet>(queryKey);
      if (previous) {
        queryClient.setQueryData<TodayDiet>(queryKey, {
          ...previous,
          takenItemIds: optimisticTakenItemIds(previous, input),
        });
      }

      return { previous } satisfies MarkDietItemsTakenContext;
    },
    onError: (_error, { date }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          DietPlansQueries.keys.today(date),
          context.previous,
        );
      }
    },
    onSuccess: (data, { date }) => {
      queryClient.setQueryData(DietPlansQueries.keys.today(date), data);
      // Intake changed, so the day's balance did too.
      void queryClient.invalidateQueries({
        queryKey: CaloriesQueries.keys.day(date),
      });
    },
  });
}

type LogPortionVariables = { date: IsoDate; input: LogPortionInput };

/** Logging off-plan food changes today's intake, so the calorie balance is
 * invalidated alongside the diet itself. */
export function useLogPortion(): UseMutationResult<
  TodayDiet,
  Error,
  LogPortionVariables
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, input }: LogPortionVariables) =>
      dietPlansService.logPortion(date, input),
    onSuccess: (data, { date }) => {
      queryClient.setQueryData(DietPlansQueries.keys.today(date), data);
      void queryClient.invalidateQueries({
        queryKey: CaloriesQueries.keys.day(date),
      });
    },
  });
}

export function useRemovePortion(): UseMutationResult<
  TodayDiet,
  Error,
  { date: IsoDate; entryId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, entryId }) =>
      dietPlansService.removePortion(date, entryId),
    onSuccess: (data, { date }) => {
      queryClient.setQueryData(DietPlansQueries.keys.today(date), data);
      void queryClient.invalidateQueries({
        queryKey: CaloriesQueries.keys.day(date),
      });
    },
  });
}
