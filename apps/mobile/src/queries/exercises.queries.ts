import type { Exercise, ExerciseMuscleGroup } from '@fitness/types';
import type { ExerciseByMuscleQueryInput } from '@fitness/validation';
import { queryOptions, useQuery, type UseQueryResult } from '@tanstack/react-query';

import { exercisesService } from '@/services/exercises.service';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

export class ExercisesQueries {
  static readonly root = ['exercises'] as const;

  static keys = {
    all: ExercisesQueries.root,
    byMuscle: (query: ExerciseByMuscleQueryInput) =>
      [...ExercisesQueries.root, 'by-muscle', query] as const,
    detail: (id: string) => [...ExercisesQueries.root, 'detail', id] as const,
  };

  static byMuscle(enabled: boolean, query: ExerciseByMuscleQueryInput) {
    return queryOptions({
      queryKey: ExercisesQueries.keys.byMuscle(query),
      queryFn: () => exercisesService.byMuscle(query),
      enabled,
      staleTime: 5 * 60 * 1000,
    });
  }

  static detail(enabled: boolean, id: string) {
    return queryOptions({
      queryKey: ExercisesQueries.keys.detail(id),
      queryFn: () => exercisesService.get(id),
      enabled,
      staleTime: 5 * 60 * 1000,
    });
  }
}

export function useExercisesByMuscle(
  query: ExerciseByMuscleQueryInput = {},
): UseQueryResult<ExerciseMuscleGroup[]> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(ExercisesQueries.byMuscle(isAuthenticated, query));
}

export function useExercise(id: string | undefined): UseQueryResult<Exercise> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(ExercisesQueries.detail(isAuthenticated && !!id, id ?? ''));
}
