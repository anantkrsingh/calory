import type { Exercise, Workout } from '@fitness/types';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { generateClientId } from '@/lib/client-id';
import { workoutsService } from '@/services/workouts.service';

export interface LogExerciseSetInput {
  exercise: Exercise;
  /** Epoch ms — when the Start button was pressed. */
  startedAt: number;
  /** Epoch ms — when Stop was pressed. */
  stoppedAt: number;
  durationSec: number;
  reps?: number;
  weightKg?: number;
  distanceM?: number;
}

/**
 * Records one Start-to-Stop rep as its own completed workout: a single
 * exercise, single set. Two calls under the hood (`create` then `complete`)
 * since that's the API's lifecycle for a workout — nothing in between is
 * ever left visible as "in progress".
 */
export function useLogExerciseSet(): UseMutationResult<
  Workout,
  Error,
  LogExerciseSetInput
> {
  return useMutation({
    mutationFn: async (input) => {
      const workout = await workoutsService.create({
        name: input.exercise.name,
        startedAt: new Date(input.startedAt).toISOString(),
        exercises: [
          {
            id: generateClientId(),
            exerciseId: input.exercise.id,
            exerciseName: input.exercise.name,
            order: 0,
            sets: [
              {
                id: generateClientId(),
                order: 0,
                type: 'working',
                reps: input.reps,
                weightKg: input.weightKg,
                durationSec: input.durationSec,
                distanceM: input.distanceM,
                completed: true,
              },
            ],
          },
        ],
      });

      return workoutsService.complete(workout.id, {
        completedAt: new Date(input.stoppedAt).toISOString(),
        durationSec: input.durationSec,
      });
    },
  });
}
