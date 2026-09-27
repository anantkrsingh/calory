import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_LOG_FIELDS,
  Prisma,
  paginate,
  toExercise,
  toSkipTake,
} from '@fitness/db';
import { MuscleGroup } from '@fitness/types';
import type {
  AuthenticatedUser,
  Exercise,
  ExerciseCatalogue,
  ExercisePersonalRecord,
  ExerciseRepHistorySession,
  ExerciseRepHistorySet,
  ExerciseRepsHistory,
  Id,
  Paginated,
} from '@fitness/types';
import type {
  CreateExerciseInput,
  ExerciseByMuscleQueryInput,
  ExerciseQueryInput,
  UpdateExerciseInput,
} from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the shared catalogue plus the caller's own custom exercises. */
  async list(
    userId: Id,
    query: ExerciseQueryInput,
  ): Promise<Paginated<Exercise>> {
    const where: Prisma.ExerciseWhereInput = {
      ...(query.customOnly
        ? { createdById: userId }
        : { OR: [{ createdById: null }, { createdById: userId }] }),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.equipment ? { equipment: query.equipment } : {}),
      ...(query.muscleGroup
        ? { primaryMuscles: { has: query.muscleGroup } }
        : {}),
    };

    const { skip, take } = toSkipTake(query);

    const [rows, total, favoriteIds] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.exercise.count({ where }),
      this.getFavoriteIds(userId),
    ]);

    return paginate(
      rows.map((row) => toExercise(row, favoriteIds.has(row.id))),
      query,
      total,
    );
  }

  /**
   * The shared catalogue plus the caller's own custom exercises, grouped by
   * primary muscle for the Build screen's browse-by-muscle list, with the
   * caller's favorites pinned above the groups. An exercise with several
   * primary muscles appears once under each of them — intentional (a dip
   * belongs under both Chest and Triceps) — and a favorited exercise appears
   * both in `favorites` and again under its usual muscle group(s).
   *
   * `search` matches either the exercise name or a muscle group name, so
   * typing "chest" surfaces the whole Chest group even for exercises whose
   * name doesn't contain the word.
   */
  async byMuscle(
    userId: Id,
    query: ExerciseByMuscleQueryInput,
  ): Promise<ExerciseCatalogue> {
    const search = query.search;
    const matchedMuscle = search ? matchMuscleGroup(search) : undefined;

    const where: Prisma.ExerciseWhereInput = {
      AND: [
        { OR: [{ createdById: null }, { createdById: userId }] },
        ...(search
          ? [
              {
                OR: [
                  { name: { contains: search, mode: 'insensitive' as const } },
                  ...(matchedMuscle
                    ? [{ primaryMuscles: { has: matchedMuscle } }]
                    : []),
                ],
              },
            ]
          : []),
      ],
    };

    const [rows, favoriteIds] = await Promise.all([
      this.prisma.exercise.findMany({ where, orderBy: { name: 'asc' } }),
      this.getFavoriteIds(userId),
    ]);
    const exercises = rows.map((row) =>
      toExercise(row, favoriteIds.has(row.id)),
    );

    const groups = new Map<MuscleGroup, Exercise[]>();
    for (const exercise of exercises) {
      for (const muscle of exercise.primaryMuscles) {
        const bucket = groups.get(muscle);
        if (bucket) bucket.push(exercise);
        else groups.set(muscle, [exercise]);
      }
    }

    return {
      favorites: exercises.filter((exercise) => exercise.isFavorite),
      groups: Object.values(MuscleGroup)
        .filter((muscle) => groups.has(muscle))
        .map((muscle) => ({ muscle, exercises: groups.get(muscle)! })),
    };
  }

  async findById(userId: Id, id: Id): Promise<Exercise> {
    const [exercise, favoriteIds] = await Promise.all([
      this.getVisibleExerciseRow(userId, id),
      this.getFavoriteIds(userId),
    ]);
    return toExercise(exercise, favoriteIds.has(exercise.id));
  }

  /**
   * Admins add to the shared catalogue (`createdById: null`).
   * Regular users create personal custom exercises.
   */
  async create(
    user: AuthenticatedUser,
    input: CreateExerciseInput,
  ): Promise<Exercise> {
    const isAdmin = user.role === 'admin';
    const exercise = await this.prisma.exercise.create({
      data: {
        ...input,
        createdById: isAdmin ? null : user.id,
        isCustom: !isAdmin,
      },
    });
    // Brand new — no one could have favorited it yet.
    return toExercise(exercise, false);
  }

  async update(
    user: AuthenticatedUser,
    id: Id,
    input: UpdateExerciseInput,
  ): Promise<Exercise> {
    const current = await this.assertCanModify(user, id);

    const [exercise, favoriteIds] = await Promise.all([
      this.prisma.exercise.update({
        where: { id },
        data: {
          ...input,
          // `logFields` in the input is a genuine partial patch (unlike the
          // rest of `input`, which is whole-value) — merge it onto what's
          // stored rather than replacing the embedded document, or omitted
          // fields would silently reset to "hidden". Same convention as
          // `UsersService.update`'s `profile`/`preferences` merge.
          ...(input.logFields
            ? {
                logFields: {
                  ...(current.logFields ?? DEFAULT_LOG_FIELDS),
                  ...input.logFields,
                },
              }
            : {}),
        },
      }),
      this.getFavoriteIds(user.id),
    ]);
    return toExercise(exercise, favoriteIds.has(exercise.id));
  }

  async remove(user: AuthenticatedUser, id: Id): Promise<void> {
    await this.assertCanModify(user, id);
    await this.prisma.exercise.delete({ where: { id } });
  }

  async addFavorite(userId: Id, exerciseId: Id): Promise<Exercise> {
    const exercise = await this.getVisibleExerciseRow(userId, exerciseId);
    const favoriteIds = await this.getFavoriteIds(userId);

    if (!favoriteIds.has(exerciseId)) {
      favoriteIds.add(exerciseId);
      await this.prisma.user.update({
        where: { id: userId },
        data: { favoriteExerciseIds: Array.from(favoriteIds) },
      });
    }

    return toExercise(exercise, true);
  }

  async removeFavorite(userId: Id, exerciseId: Id): Promise<Exercise> {
    const exercise = await this.getVisibleExerciseRow(userId, exerciseId);
    const favoriteIds = await this.getFavoriteIds(userId);

    if (favoriteIds.delete(exerciseId)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { favoriteExerciseIds: Array.from(favoriteIds) },
      });
    }

    return toExercise(exercise, false);
  }

  /** Mongo scalar-array fields only support full replace via Prisma, so
   * favoriting is read-modify-write rather than an atomic add/remove. */
  private async getFavoriteIds(userId: Id): Promise<Set<Id>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { favoriteExerciseIds: true },
    });
    return new Set(user?.favoriteExerciseIds ?? []);
  }

  /**
   * Best-ever numbers for one exercise, scanned across the user's completed
   * workouts. Sets live inside the workout document, so this filters in memory
   * after narrowing to workouts that reference the exercise at all.
   */
  async personalRecords(
    userId: Id,
    exerciseId: Id,
  ): Promise<ExercisePersonalRecord> {
    const exercise = await this.findById(userId, exerciseId);

    const workouts = await this.prisma.workout.findMany({
      where: {
        userId,
        status: 'completed',
        exercises: { some: { exerciseId } },
      },
      orderBy: { startedAt: 'asc' },
    });

    const record: ExercisePersonalRecord = {
      exerciseId,
      exerciseName: exercise.name,
      achievedAt: exercise.createdAt,
    };

    for (const workout of workouts) {
      for (const workoutExercise of workout.exercises) {
        if (workoutExercise.exerciseId !== exerciseId) continue;

        for (const set of workoutExercise.sets) {
          if (!set.completed) continue;

          let improved = false;

          if (
            set.weightKg != null &&
            set.weightKg > (record.bestWeightKg ?? 0)
          ) {
            record.bestWeightKg = set.weightKg;
            improved = true;
          }
          if (set.reps != null && set.reps > (record.bestReps ?? 0)) {
            record.bestReps = set.reps;
            improved = true;
          }
          if (
            set.distanceM != null &&
            set.distanceM > (record.bestDistanceM ?? 0)
          ) {
            record.bestDistanceM = set.distanceM;
            improved = true;
          }
          if (
            set.durationSec != null &&
            set.durationSec > (record.bestDurationSec ?? 0)
          ) {
            record.bestDurationSec = set.durationSec;
            improved = true;
          }

          if (set.weightKg != null && set.reps != null) {
            const volume = set.weightKg * set.reps;
            if (volume > (record.bestVolumeKg ?? 0)) {
              record.bestVolumeKg = volume;
              improved = true;
            }

            const oneRepMax = estimateOneRepMax(set.weightKg, set.reps);
            if (oneRepMax > (record.bestEstimatedOneRepMaxKg ?? 0)) {
              record.bestEstimatedOneRepMaxKg = oneRepMax;
              improved = true;
            }
          }

          if (improved) {
            record.achievedAt = workout.startedAt.toISOString();
          }
        }
      }
    }

    return record;
  }

  /**
   * Complete reps and set progression history for one exercise.
   * Respects user's active plan repsHistoryDays limit if configured.
   */
  async repsHistory(
    userId: Id,
    exerciseId: Id,
  ): Promise<ExerciseRepsHistory> {
    const exercise = await this.findById(userId, exerciseId);
    const pr = await this.personalRecords(userId, exerciseId);

    // Check user plan limit on reps history days
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        planId: true,
        plan: { select: { repsHistoryDays: true } },
      },
    });

    let historyLimitDays: number | undefined = undefined;
    let isLimitedByPlan = false;
    let cutoffDate: Date | undefined = undefined;

    if (user?.plan?.repsHistoryDays) {
      historyLimitDays = user.plan.repsHistoryDays;
      isLimitedByPlan = true;
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - historyLimitDays);
    } else if (!user?.planId) {
      // Check if active default plan has repsHistoryDays limit
      const activeFreePlan = await this.prisma.plan.findFirst({
        where: { price: 0, isActive: true },
        select: { repsHistoryDays: true },
      });
      if (activeFreePlan?.repsHistoryDays) {
        historyLimitDays = activeFreePlan.repsHistoryDays;
        isLimitedByPlan = true;
        cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - historyLimitDays);
      }
    }

    const workouts = await this.prisma.workout.findMany({
      where: {
        userId,
        status: 'completed',
        exercises: { some: { exerciseId } },
        ...(cutoffDate ? { startedAt: { gte: cutoffDate } } : {}),
      },
      orderBy: { startedAt: 'desc' },
    });

    const sessions: ExerciseRepHistorySession[] = [];
    let totalSets = 0;
    let totalReps = 0;
    let maxWeightKg: number | undefined = undefined;
    let maxReps: number | undefined = undefined;
    let bestEstimatedOneRepMaxKg: number | undefined = undefined;

    for (const workout of workouts) {
      const exerciseEntry = workout.exercises.find((e) => e.exerciseId === exerciseId);
      if (!exerciseEntry) continue;

      const completedSets = exerciseEntry.sets.filter((s) => s.completed);
      if (completedSets.length === 0) continue;

      const sets: ExerciseRepHistorySet[] = completedSets.map((s, index) => {
        const reps = s.reps ?? undefined;
        const weightKg = s.weightKg ?? undefined;
        let volumeKg: number | undefined = undefined;
        let estimatedOneRepMaxKg: number | undefined = undefined;

        if (reps != null) {
          totalReps += reps;
          if (maxReps === undefined || reps > maxReps) {
            maxReps = reps;
          }
        }

        if (weightKg != null) {
          if (maxWeightKg === undefined || weightKg > maxWeightKg) {
            maxWeightKg = weightKg;
          }
        }

        if (weightKg != null && reps != null) {
          volumeKg = Math.round(weightKg * reps * 10) / 10;
          estimatedOneRepMaxKg = estimateOneRepMax(weightKg, reps);
          if (
            bestEstimatedOneRepMaxKg === undefined ||
            estimatedOneRepMaxKg > bestEstimatedOneRepMaxKg
          ) {
            bestEstimatedOneRepMaxKg = estimatedOneRepMaxKg;
          }
        }

        const isPersonalRecord = Boolean(
          (weightKg != null && pr.bestWeightKg != null && weightKg >= pr.bestWeightKg) ||
          (reps != null && pr.bestReps != null && reps >= pr.bestReps) ||
          (estimatedOneRepMaxKg != null &&
            pr.bestEstimatedOneRepMaxKg != null &&
            estimatedOneRepMaxKg >= pr.bestEstimatedOneRepMaxKg),
        );

        return {
          setId: s.id || `set-${index + 1}`,
          order: s.order ?? index,
          type: s.type,
          reps,
          weightKg,
          durationSec: s.durationSec ?? undefined,
          distanceM: s.distanceM ?? undefined,
          rpe: s.rpe ?? undefined,
          completed: s.completed,
          notes: s.notes ?? undefined,
          estimatedOneRepMaxKg,
          volumeKg,
          isPersonalRecord,
        };
      });

      totalSets += sets.length;

      sessions.push({
        workoutId: workout.id,
        workoutName: workout.name,
        date: workout.startedAt.toISOString(),
        durationSec: workout.durationSec ?? undefined,
        sets,
      });
    }

    return {
      exerciseId,
      exerciseName: exercise.name,
      personalRecord: pr,
      totalSessions: sessions.length,
      totalSets,
      totalReps,
      maxWeightKg: maxWeightKg ?? pr.bestWeightKg,
      maxReps: maxReps ?? pr.bestReps,
      bestEstimatedOneRepMaxKg:
        bestEstimatedOneRepMaxKg ?? pr.bestEstimatedOneRepMaxKg,
      historyLimitDays,
      isLimitedByPlan,
      sessions,
    };
  }

  /** Loads an exercise, throwing if it doesn't exist or is another user's
   * custom exercise. Shared by `findById` and the favorite toggles. */
  private async getVisibleExerciseRow(userId: Id, id: Id) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });

    if (
      !exercise ||
      (exercise.createdById && exercise.createdById !== userId)
    ) {
      throw new NotFoundException('Exercise not found');
    }

    return exercise;
  }

  /**
   * Catalogue exercises are editable by admins.
   * Custom exercises are editable by their owner.
   * Returns the current row so `update` can merge onto it (e.g. `logFields`)
   * without a second round trip.
   */
  private async assertCanModify(
    user: AuthenticatedUser,
    id: Id,
  ): Promise<Prisma.ExerciseGetPayload<Record<string, never>>> {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });

    if (!exercise) throw new NotFoundException('Exercise not found');

    const isCatalogue = exercise.createdById === null;
    if (
      (isCatalogue && user.role === 'admin') ||
      exercise.createdById === user.id
    ) {
      return exercise;
    }

    throw new ForbiddenException(
      isCatalogue
        ? 'Only admins can modify catalogue exercises'
        : 'Only custom exercises you created can be modified',
    );
  }
}

/** Epley formula, rounded to one decimal. */
function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

/**
 * Loosely matches a search term against a muscle group, accepting the raw
 * enum value or its spaced-out label ("full body" / "full-body" → full_body).
 */
function matchMuscleGroup(search: string): MuscleGroup | undefined {
  const normalized = search
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return Object.values(MuscleGroup).find((muscle) => muscle === normalized);
}
