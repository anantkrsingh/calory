import type {
  DailyCaloriesBurned,
  IsoDate,
  TodayRoutine,
  WorkoutRoutine,
} from '@fitness/types';
import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { workoutRoutinesService } from '@/services/workout-routines.service';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

export class WorkoutRoutinesQueries {
  static readonly root = ['workout-routines'] as const;

  static keys = {
    all: WorkoutRoutinesQueries.root,
    me: () => [...WorkoutRoutinesQueries.root, 'me'] as const,
    today: (date: IsoDate) => [...WorkoutRoutinesQueries.root, 'today', date] as const,
    calories: (from: IsoDate, to: IsoDate) =>
      [...WorkoutRoutinesQueries.root, 'calories', from, to] as const,
  };

  static me(enabled: boolean) {
    return queryOptions({
      queryKey: WorkoutRoutinesQueries.keys.me(),
      queryFn: () => workoutRoutinesService.me(),
      enabled,
      staleTime: 5 * 60 * 1000,
    });
  }

  static today(enabled: boolean, date: IsoDate) {
    return queryOptions({
      queryKey: WorkoutRoutinesQueries.keys.today(date),
      queryFn: () => workoutRoutinesService.today(date),
      enabled,
      // Short — steps/completed sets change through the day and this drives
      // the home screen's live rings.
      staleTime: 60 * 1000,
      // Keep showing the previously-selected day's data while a newly
      // selected day is still loading, instead of `data` going undefined —
      // the home screen's rings/exercise list would otherwise flash to
      // zero/empty every time the selected day changes.
      placeholderData: keepPreviousData,
      // Poll while the plan is still generating, so the loading state clears
      // on its own once it's ready instead of waiting for the next reopen.
      refetchInterval: (query) =>
        query.state.data?.routineStatus === 'generating' ? 4000 : false,
    });
  }

  static calories(enabled: boolean, from: IsoDate, to: IsoDate) {
    return queryOptions({
      queryKey: WorkoutRoutinesQueries.keys.calories(from, to),
      queryFn: () => workoutRoutinesService.calories(from, to),
      enabled,
      staleTime: 60 * 1000,
    });
  }
}

export function useWorkoutRoutine(): UseQueryResult<WorkoutRoutine> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(WorkoutRoutinesQueries.me(isAuthenticated));
}

/** Today's steps/calorie targets from the active routine, layered with real
 * progress so far — powers the home screen's rings. */
export function useTodayRoutine(date: IsoDate): UseQueryResult<TodayRoutine> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(WorkoutRoutinesQueries.today(isAuthenticated, date));
}

/** Calories credited per day over a date range — the home screen's weekly
 * calorie strip and the weekly-progress history sheet. `enabled` lets a
 * caller defer a wide/rarely-needed range until it's actually shown. */
export function useWeekCalories(
  from: IsoDate,
  to: IsoDate,
  enabled = true,
): UseQueryResult<DailyCaloriesBurned[]> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(
    WorkoutRoutinesQueries.calories(isAuthenticated && enabled, from, to),
  );
}

export function useRegenerateRoutine(): UseMutationResult<WorkoutRoutine, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => workoutRoutinesService.regenerate(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WorkoutRoutinesQueries.root });
    },
  });
}
