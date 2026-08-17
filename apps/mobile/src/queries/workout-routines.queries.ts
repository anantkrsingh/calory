import {
  queryOptions,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  workoutRoutinesService,
  type TodayCalories,
} from '@/services/workout-routines.service';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

export class WorkoutRoutinesQueries {
  static readonly root = ['workout-routines'] as const;

  static keys = {
    all: WorkoutRoutinesQueries.root,
    todayCalories: () => [...WorkoutRoutinesQueries.root, 'today-calories'] as const,
  };

  static todayCalories(enabled: boolean) {
    return queryOptions({
      queryKey: WorkoutRoutinesQueries.keys.todayCalories(),
      queryFn: () => workoutRoutinesService.todayCalories(),
      enabled,
      staleTime: 5 * 60 * 1000,
    });
  }
}

export function useTodayCalories(): UseQueryResult<TodayCalories> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(WorkoutRoutinesQueries.todayCalories(isAuthenticated));
}
