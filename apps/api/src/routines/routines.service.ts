import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  paginate,
  toRoutine,
  toSkipTake,
  toWorkout,
  type RoutineExerciseComposite,
  type RoutineRow,
  type WorkoutExerciseComposite,
} from '@fitness/db';
import type {
  Id,
  MuscleGroup,
  Paginated,
  Routine,
  RoutineSummary,
  Workout,
} from '@fitness/types';
import type {
  CreateRoutineInput,
  RoutineQueryInput,
  StartRoutineInput,
  UpdateRoutineInput,
} from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';
import { computeStats } from '../workouts/workout-stats';

@Injectable()
export class RoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: Id,
    query: RoutineQueryInput,
  ): Promise<Paginated<RoutineSummary>> {
    const where: Prisma.RoutineWhereInput = {
      userId,
      ...(query.includeArchived ? {} : { isArchived: false }),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const { skip, take } = toSkipTake(query);

    const [rows, total] = await Promise.all([
      this.prisma.routine.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.routine.count({ where }),
    ]);

    const summaries: RoutineSummary[] = rows.map((row) => {
      const routine = toRoutine(row);
      return {
        id: routine.id,
        name: routine.name,
        description: routine.description,
        exerciseCount: routine.exercises.length,
        targetMuscles: routine.targetMuscles,
        estimatedDurationSec: routine.estimatedDurationSec,
        lastPerformedAt: routine.lastPerformedAt,
      };
    });

    return paginate(summaries, query, total);
  }

  async findById(userId: Id, id: Id): Promise<Routine> {
    return toRoutine(await this.getOwned(userId, id));
  }

  async create(userId: Id, input: CreateRoutineInput): Promise<Routine> {
    const exercises = input.exercises as RoutineExerciseComposite[];

    const routine = await this.prisma.routine.create({
      data: {
        userId,
        name: input.name,
        exercises,
        targetMuscles: await this.deriveTargetMuscles(exercises),
        ...(input.description ? { description: input.description } : {}),
        ...(input.estimatedDurationSec != null
          ? { estimatedDurationSec: input.estimatedDurationSec }
          : {}),
      },
    });

    return toRoutine(routine);
  }

  async update(
    userId: Id,
    id: Id,
    input: UpdateRoutineInput,
  ): Promise<Routine> {
    await this.getOwned(userId, id);

    const exercises = input.exercises as RoutineExerciseComposite[] | undefined;

    const routine = await this.prisma.routine.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.description != null
          ? { description: input.description }
          : {}),
        ...(input.estimatedDurationSec != null
          ? { estimatedDurationSec: input.estimatedDurationSec }
          : {}),
        ...(input.isArchived != null ? { isArchived: input.isArchived } : {}),
        ...(exercises
          ? {
              exercises,
              targetMuscles: await this.deriveTargetMuscles(exercises),
            }
          : {}),
      },
    });

    return toRoutine(routine);
  }

  async remove(userId: Id, id: Id): Promise<void> {
    await this.getOwned(userId, id);
    await this.prisma.routine.delete({ where: { id } });
  }

  /**
   * Instantiates the routine as a live workout: target values become the first
   * draft of each set, uncompleted, for the user to confirm as they train.
   */
  async start(userId: Id, id: Id, input: StartRoutineInput): Promise<Workout> {
    const routine = await this.getOwned(userId, id);

    const exercises: WorkoutExerciseComposite[] = routine.exercises.map(
      (exercise) => ({
        id: exercise.id,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        order: exercise.order,
        restSeconds: exercise.restSeconds,
        notes: exercise.notes,
        sets: exercise.sets.map((set) => ({
          id: set.id,
          order: set.order,
          type: set.type,
          reps: set.targetReps,
          weightKg: set.targetWeightKg,
          durationSec: set.targetDurationSec,
          distanceM: set.targetDistanceM,
          rpe: null,
          completed: false,
          notes: null,
        })),
      }),
    );

    const workout = await this.prisma.workout.create({
      data: {
        userId,
        name: input.name ?? routine.name,
        status: 'in_progress',
        startedAt: new Date(),
        exercises,
        stats: computeStats(exercises),
        routineId: routine.id,
      },
    });

    return toWorkout(workout);
  }

  /** Union of the primary muscles of every exercise the routine references. */
  private async deriveTargetMuscles(
    exercises: RoutineExerciseComposite[],
  ): Promise<MuscleGroup[]> {
    const ids = [...new Set(exercises.map((exercise) => exercise.exerciseId))];
    if (ids.length === 0) return [];

    const rows = await this.prisma.exercise.findMany({
      where: { id: { in: ids } },
      select: { primaryMuscles: true },
    });

    return [...new Set(rows.flatMap((row) => row.primaryMuscles))];
  }

  private async getOwned(userId: Id, id: Id): Promise<RoutineRow> {
    const routine = await this.prisma.routine.findUnique({ where: { id } });

    if (!routine || routine.userId !== userId) {
      throw new NotFoundException('Routine not found');
    }

    return routine;
  }
}
