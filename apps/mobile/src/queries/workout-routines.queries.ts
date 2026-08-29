import type { IsoDate, TodayRoutine, WorkoutRoutine } from '@fitness/types';
import {
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

export function useRegenerateRoutine(): UseMutationResult<WorkoutRoutine, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => workoutRoutinesService.regenerate(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WorkoutRoutinesQueries.root });
    },
  });
}
