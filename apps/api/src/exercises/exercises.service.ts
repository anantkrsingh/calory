import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, paginate, toExercise, toSkipTake } from '@fitness/db';
import type {
  AuthenticatedUser,
  Exercise,
  ExercisePersonalRecord,
  Id,
  Paginated,
} from '@fitness/types';
import type {
  CreateExerciseInput,
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
