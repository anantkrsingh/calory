import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  paginate,
  toSkipTake,
  toWorkout,
  toWorkoutSummary,
  type WorkoutExerciseComposite,
  type WorkoutRow,
} from '@fitness/db';
import type { Id, Paginated, Workout, WorkoutSummary } from '@fitness/types';
import type {
  CompleteWorkoutInput,
  CreateWorkoutInput,
  LogSetInput,
  UpdateWorkoutInput,
  WorkoutQueryInput,
} from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';
import { computeStats } from './workout-stats';

@Injectable()
export class WorkoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: Id,
    query: WorkoutQueryInput,
  ): Promise<Paginated<WorkoutSummary>> {
    const where: Prisma.WorkoutWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.exerciseId
        ? { exercises: { some: { exerciseId: query.exerciseId } } }
        : {}),
      ...(query.from || query.to
        ? {
            startedAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const { skip, take } = toSkipTake(query);

    const [rows, total] = await Promise.all([
      this.prisma.workout.findMany({
        where,
        skip,
        take,
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.workout.count({ where }),
    ]);

    return paginate(rows.map(toWorkoutSummary), query, total);
  }

  async findById(userId: Id, id: Id): Promise<Workout> {
    return toWorkout(await this.getOwned(userId, id));
  }

  /** The single open workout, if any — drives the mobile "resume" banner. */
  async findActive(userId: Id): Promise<Workout | null> {
    const workout = await this.prisma.workout.findFirst({
      where: { userId, status: 'in_progress' },
      orderBy: { startedAt: 'desc' },
    });

    return workout ? toWorkout(workout) : null;
  }

  async create(userId: Id, input: CreateWorkoutInput): Promise<Workout> {
    const open = await this.prisma.workout.count({
      where: { userId, status: 'in_progress' },
    });

    if (open > 0) {
      throw new ConflictException(
        'Finish or cancel the workout already in progress first',
      );
    }

    const exercises = input.exercises as WorkoutExerciseComposite[];

    const workout = await this.prisma.workout.create({
      data: {
        userId,
        name: input.name,
        status: 'in_progress',
        startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
        exercises,
        stats: computeStats(exercises),
        ...(input.notes ? { notes: input.notes } : {}),
        ...(input.routineId ? { routineId: input.routineId } : {}),
      },
    });

    return toWorkout(workout);
  }

  async update(
    userId: Id,
    id: Id,
    input: UpdateWorkoutInput,
  ): Promise<Workout> {
    const current = await this.getOwned(userId, id);

    if (current.status !== 'in_progress' && input.exercises) {
      throw new BadRequestException(
        'The exercises of a finished workout can no longer be edited',
      );
    }

    const exercises = (input.exercises ??
      current.exercises) as WorkoutExerciseComposite[];

    const workout = await this.prisma.workout.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.startedAt ? { startedAt: new Date(input.startedAt) } : {}),
        ...(input.completedAt
          ? { completedAt: new Date(input.completedAt) }
          : {}),
        ...(input.durationSec != null ? { durationSec: input.durationSec } : {}),
        ...(input.notes != null ? { notes: input.notes } : {}),
        ...(input.exercises ? { exercises } : {}),
        stats: computeStats(exercises),
      },
    });

    return toWorkout(workout);
  }

  /**
   * Appends one set to an exercise. Kept separate from `update` so a phone that
   * has been offline replays individual sets without shipping the whole tree
   * and clobbering anything logged from another device.
   */
  async logSet(userId: Id, id: Id, input: LogSetInput): Promise<Workout> {
    const current = await this.getOwned(userId, id);

    if (current.status !== 'in_progress') {
      throw new BadRequestException('Workout is no longer in progress');
    }

    const target = current.exercises.find(
      (exercise) => exercise.id === input.workoutExerciseId,
    );

    if (!target) {
      throw new NotFoundException('Exercise is not part of this workout');
    }

    const exercises = current.exercises.map((exercise) => {
      if (exercise.id !== input.workoutExerciseId) return exercise;

      // Same client id means a retried request — replace rather than duplicate.
      const sets = exercise.sets.filter((set) => set.id !== input.set.id);
      return {
        ...exercise,
        sets: [...sets, input.set as WorkoutExerciseComposite['sets'][number]].sort(
          (a, b) => a.order - b.order,
        ),
      };
    });

    const workout = await this.prisma.workout.update({
      where: { id },
      data: { exercises, stats: computeStats(exercises) },
    });

    return toWorkout(workout);
  }

  async complete(
    userId: Id,
    id: Id,
    input: CompleteWorkoutInput,
  ): Promise<Workout> {
    const current = await this.getOwned(userId, id);

    if (current.status === 'completed') {
      throw new ConflictException('Workout is already completed');
    }

    const completedAt = input.completedAt
      ? new Date(input.completedAt)
      : new Date();

    const durationSec =
      input.durationSec ??
      Math.max(
        0,
        Math.round((completedAt.getTime() - current.startedAt.getTime()) / 1000),
      );

    const workout = await this.prisma.workout.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt,
        durationSec,
        ...(input.notes != null ? { notes: input.notes } : {}),
        stats: computeStats(current.exercises),
      },
    });

    if (current.routineId) {
      await this.prisma.routine.update({
        where: { id: current.routineId },
        data: { lastPerformedAt: completedAt },
      });
    }

    return toWorkout(workout);
  }

  async cancel(userId: Id, id: Id): Promise<Workout> {
    const current = await this.getOwned(userId, id);

    if (current.status !== 'in_progress') {
      throw new BadRequestException('Only an in-progress workout can be cancelled');
    }

    const workout = await this.prisma.workout.update({
      where: { id },
      data: { status: 'cancelled', completedAt: new Date() },
    });

    return toWorkout(workout);
  }

  async remove(userId: Id, id: Id): Promise<void> {
    await this.getOwned(userId, id);
    await this.prisma.workout.delete({ where: { id } });
  }

  private async getOwned(userId: Id, id: Id): Promise<WorkoutRow> {
    const workout = await this.prisma.workout.findUnique({ where: { id } });

    // Same 404 for "missing" and "someone else's" — never confirm existence.
    if (!workout || workout.userId !== userId) {
      throw new NotFoundException('Workout not found');
    }

    return workout;
  }
}
