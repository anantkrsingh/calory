import type { WorkoutExerciseComposite, WorkoutStatsComposite } from '@fitness/db';

/**
 * Recomputes a workout's totals from its sets. Always derived server-side —
 * client-sent stats are ignored, so an offline client cannot desync the numbers
 * the dashboard and goals read from.
 */
export function computeStats(
  exercises: WorkoutExerciseComposite[],
): WorkoutStatsComposite {
  const stats: WorkoutStatsComposite = {
    totalSets: 0,
    completedSets: 0,
    totalVolumeKg: 0,
    totalReps: 0,
    totalDistanceM: 0,
    totalDurationSec: 0,
  };

  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      stats.totalSets += 1;

      // Only completed sets count toward training volume; a planned-but-skipped
      // set should not inflate progress.
      if (!set.completed) continue;

      stats.completedSets += 1;
      stats.totalReps += set.reps ?? 0;
      stats.totalDistanceM += set.distanceM ?? 0;
      stats.totalDurationSec += set.durationSec ?? 0;

      if (set.weightKg != null && set.reps != null) {
        stats.totalVolumeKg += set.weightKg * set.reps;
      }
    }
  }

  stats.totalVolumeKg = Math.round(stats.totalVolumeKg * 100) / 100;
  return stats;
}
