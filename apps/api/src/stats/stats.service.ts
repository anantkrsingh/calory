import { Injectable, NotFoundException } from '@nestjs/common';
import type { WorkoutRow } from '@fitness/db';
import type {
  DailyActivity,
  DashboardStats,
  Id,
  MuscleGroup,
  VolumeByMuscleGroup,
  WorkoutStreak,
} from '@fitness/types';
import type { DashboardQueryInput, StatsRangeInput } from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 86_400_000;
// Preferences no longer carry a per-user weekly workout target.
const DEFAULT_WEEKLY_TARGET = 3;

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(
    userId: Id,
    query: DashboardQueryInput,
  ): Promise<DashboardStats> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const since = new Date(Date.now() - query.days * DAY_MS);

    const [completed, recent] = await Promise.all([
      this.prisma.workout.findMany({
        where: { userId, status: 'completed' },
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.workout.findMany({
        where: { userId, status: 'completed', startedAt: { gte: since } },
        orderBy: { startedAt: 'asc' },
      }),
    ]);

    const weekStart = startOfWeek(new Date());

    return {
      userId,
      workoutsThisWeek: completed.filter(
        (workout) => workout.startedAt >= weekStart,
      ).length,
      weeklyTarget: DEFAULT_WEEKLY_TARGET,
      totalWorkouts: completed.length,
      totalVolumeKg:
        Math.round(
          completed.reduce((sum, w) => sum + w.stats.totalVolumeKg, 0) * 100,
        ) / 100,
      totalDurationSec: completed.reduce(
        (sum, w) => sum + (w.durationSec ?? 0),
        0,
      ),
      streak: computeStreak(completed),
      volumeByMuscleGroup: await this.aggregateVolume(recent),
      recentActivity: aggregateDaily(recent, query.days),
    };
  }

  async volumeByMuscleGroup(
    userId: Id,
    range: StatsRangeInput,
  ): Promise<VolumeByMuscleGroup[]> {
    const workouts = await this.prisma.workout.findMany({
      where: {
        userId,
        status: 'completed',
        startedAt: { gte: new Date(range.from), lte: endOfDay(range.to) },
      },
    });

    return this.aggregateVolume(workouts);
  }

  async activity(userId: Id, range: StatsRangeInput): Promise<DailyActivity[]> {
    const from = new Date(range.from);
    const to = endOfDay(range.to);

    const workouts = await this.prisma.workout.findMany({
      where: { userId, status: 'completed', startedAt: { gte: from, lte: to } },
      orderBy: { startedAt: 'asc' },
    });

    const days = Math.max(
      1,
      Math.ceil((to.getTime() - from.getTime()) / DAY_MS),
    );

    return aggregateDaily(workouts, days, to);
  }

  /**
   * Attributes each set's volume to the primary muscles of its exercise. Split
   * evenly when an exercise has several, so a compound lift does not count its
   * full tonnage once per muscle.
   */
  private async aggregateVolume(
    workouts: WorkoutRow[],
  ): Promise<VolumeByMuscleGroup[]> {
    const exerciseIds = [
      ...new Set(
        workouts.flatMap((workout) =>
          workout.exercises.map((exercise) => exercise.exerciseId),
        ),
      ),
    ];

    if (exerciseIds.length === 0) return [];

    const catalogue = await this.prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: { id: true, primaryMuscles: true },
    });

    const musclesById = new Map(
      catalogue.map((row) => [row.id, row.primaryMuscles]),
    );

    const totals = new Map<
      MuscleGroup,
      { volumeKg: number; setCount: number }
    >();

    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        const muscles = musclesById.get(exercise.exerciseId);
        if (!muscles || muscles.length === 0) continue;

        for (const set of exercise.sets) {
          if (!set.completed) continue;

          const volume =
            set.weightKg != null && set.reps != null
              ? set.weightKg * set.reps
              : 0;

          for (const muscle of muscles) {
            const entry = totals.get(muscle) ?? { volumeKg: 0, setCount: 0 };
            entry.volumeKg += volume / muscles.length;
            entry.setCount += 1;
            totals.set(muscle, entry);
          }
        }
      }
    }

    return [...totals.entries()]
      .map(([muscleGroup, entry]) => ({
        muscleGroup,
        volumeKg: Math.round(entry.volumeKg * 100) / 100,
        setCount: entry.setCount,
      }))
      .sort((a, b) => b.volumeKg - a.volumeKg);
  }
}

/** Monday-based week start, in the server's local zone. */
function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(isoDate: string): Date {
  const date = new Date(isoDate);
  date.setHours(23, 59, 59, 999);
  return date;
}

const dayKey = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * A streak survives a rest day only if the gap is under two days — training
 * yesterday keeps today's streak alive, but a two-day gap breaks it.
 */
function computeStreak(workouts: WorkoutRow[]): WorkoutStreak {
  if (workouts.length === 0) {
    return { currentDays: 0, longestDays: 0 };
  }

  const days = [...new Set(workouts.map((w) => dayKey(w.startedAt)))]
    .sort()
    .reverse();

  let longest = 1;
  let run = 1;

  for (let i = 1; i < days.length; i += 1) {
    const gap = Math.round(
      (Date.parse(days[i - 1]!) - Date.parse(days[i]!)) / DAY_MS,
    );

    if (gap === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - DAY_MS));
  const mostRecent = days[0]!;

  let current = 0;
  if (mostRecent === today || mostRecent === yesterday) {
    current = 1;
    for (let i = 1; i < days.length; i += 1) {
      const gap = Math.round(
        (Date.parse(days[i - 1]!) - Date.parse(days[i]!)) / DAY_MS,
      );
      if (gap !== 1) break;
      current += 1;
    }
  }

  const lastWorkoutAt = workouts[0]?.startedAt.toISOString();

  return {
    currentDays: current,
    longestDays: longest,
    ...(lastWorkoutAt ? { lastWorkoutAt } : {}),
  };
}

/** Emits one row per day including zero-activity days, oldest first. */
function aggregateDaily(
  workouts: WorkoutRow[],
  days: number,
  until: Date = new Date(),
): DailyActivity[] {
  const byDay = new Map<string, DailyActivity>();

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = dayKey(new Date(until.getTime() - i * DAY_MS));
    byDay.set(date, { date, workoutCount: 0, volumeKg: 0, durationSec: 0 });
  }

  for (const workout of workouts) {
    const entry = byDay.get(dayKey(workout.startedAt));
    if (!entry) continue;

    entry.workoutCount += 1;
    entry.volumeKg += workout.stats.totalVolumeKg;
    entry.durationSec += workout.durationSec ?? 0;
  }

  return [...byDay.values()].map((entry) => ({
    ...entry,
    volumeKg: Math.round(entry.volumeKg * 100) / 100,
  }));
}
