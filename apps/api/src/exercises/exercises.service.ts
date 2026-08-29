import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, paginate, toExercise, toSkipTake } from '@fitness/db';
import { MuscleGroup } from '@fitness/types';
import type {
  AuthenticatedUser,
  Exercise,
  ExerciseMuscleGroup,
  ExercisePersonalRecord,
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
      ...(query.muscleGroup ? { primaryMuscles: { has: query.muscleGroup } } : {}),
    };

    const { skip, take } = toSkipTake(query);

    const [rows, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return paginate(rows.map(toExercise), query, total);
  }

  /**
   * The shared catalogue plus the caller's own custom exercises, grouped by
   * primary muscle for the Build screen's browse-by-muscle list. An exercise
   * with several primary muscles appears once under each of them — this is
   * intentional (a dip belongs under both Chest and Triceps).
   *
   * `search` matches either the exercise name or a muscle group name, so
   * typing "chest" surfaces the whole Chest group even for exercises whose
   * name doesn't contain the word.
   */
  async byMuscle(
    userId: Id,
    query: ExerciseByMuscleQueryInput,
  ): Promise<ExerciseMuscleGroup[]> {
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

    const rows = await this.prisma.exercise.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    const exercises = rows.map(toExercise);

    const groups = new Map<MuscleGroup, Exercise[]>();
    for (const exercise of exercises) {
      for (const muscle of exercise.primaryMuscles) {
        const bucket = groups.get(muscle);
        if (bucket) bucket.push(exercise);
        else groups.set(muscle, [exercise]);
      }
    }

    return Object.values(MuscleGroup)
      .filter((muscle) => groups.has(muscle))
      .map((muscle) => ({ muscle, exercises: groups.get(muscle)! }));
  }

  async findById(userId: Id, id: Id): Promise<Exercise> {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });

    if (!exercise || (exercise.createdById && exercise.createdById !== userId)) {
      throw new NotFoundException('Exercise not found');
    }

    return toExercise(exercise);
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
    return toExercise(exercise);
  }

  async update(
    user: AuthenticatedUser,
    id: Id,
    input: UpdateExerciseInput,
  ): Promise<Exercise> {
    await this.assertCanModify(user, id);
    const exercise = await this.prisma.exercise.update({
      where: { id },
      data: input,
    });
    return toExercise(exercise);
  }

  async remove(user: AuthenticatedUser, id: Id): Promise<void> {
    await this.assertCanModify(user, id);
    await this.prisma.exercise.delete({ where: { id } });
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

          if (set.weightKg != null && set.weightKg > (record.bestWeightKg ?? 0)) {
            record.bestWeightKg = set.weightKg;
            improved = true;
          }
          if (set.reps != null && set.reps > (record.bestReps ?? 0)) {
            record.bestReps = set.reps;
            improved = true;
          }
          if (set.distanceM != null && set.distanceM > (record.bestDistanceM ?? 0)) {
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
   * Catalogue exercises are editable by admins.
   * Custom exercises are editable by their owner.
   */
  private async assertCanModify(
    user: AuthenticatedUser,
    id: Id,
  ): Promise<void> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!exercise) throw new NotFoundException('Exercise not found');

    const isCatalogue = exercise.createdById === null;
    if (isCatalogue && user.role === 'admin') return;
    if (exercise.createdById === user.id) return;

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
  const normalized = search.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return Object.values(MuscleGroup).find((muscle) => muscle === normalized);
}
