import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { toWorkoutRoutine } from '@fitness/db';
import { DayOfWeek } from '@fitness/types';
import type {
  DailyCaloriesBurned,
  Id,
  IsoDate,
  RoutinePlanDay,
  TodayRoutine,
  TodayRoutineExercise,
  WorkoutRoutine,
} from '@fitness/types';

import { PrismaService } from '../prisma/prisma.service';
import { RoutineQueue } from '../queues/routine.queue';

const WEEKDAYS: DayOfWeek[] = [
  DayOfWeek.Sunday,
  DayOfWeek.Monday,
  DayOfWeek.Tuesday,
  DayOfWeek.Wednesday,
  DayOfWeek.Thursday,
  DayOfWeek.Friday,
  DayOfWeek.Saturday,
];

/** ISO date (`YYYY-MM-DD`) → weekday, matching `RoutinePlanDay.dayOfWeek`. */
function dayOfWeekOf(date: IsoDate): DayOfWeek {
  const jsDay = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return WEEKDAYS[jsDay] ?? DayOfWeek.Sunday;
}

/** Inclusive list of every ISO date from `from` to `to`. */
function enumerateDates(from: IsoDate, to: IsoDate): IsoDate[] {
  const dates: IsoDate[] = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

@Injectable()
export class WorkoutRoutineService {
  private readonly logger = new Logger(WorkoutRoutineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: RoutineQueue,
  ) {}

  /** Never throws: a failure here must not stop registration from completing. */
  async requestGeneration(userId: Id): Promise<WorkoutRoutine | null> {
    try {
      const routine = await this.prisma.workoutRoutine.create({
        data: { userId, status: 'generating', days: [] },
      });

      const job = await this.queue.generate({ userId, routineId: routine.id });

      if (!job) {
        // Nothing will process it, so retire the placeholder and keep whatever
        // routine the user already had.
        await this.prisma.workoutRoutine.update({
          where: { id: routine.id },
          data: { status: 'failed', error: 'Could not queue generation job' },
        });
        return null;
      }

      // Only retire the previous routine once the new job is safely queued.
      await this.prisma.workoutRoutine.updateMany({
        where: {
          userId,
          id: { not: routine.id },
          status: { in: ['generating', 'active'] },
        },
        data: { status: 'superseded' },
      });

      return toWorkoutRoutine(routine);
    } catch (error) {
      this.logger.error(
        `Could not request routine generation for ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  /** The newest routine that is still generating, active or failed. */
  async findCurrent(userId: Id): Promise<WorkoutRoutine> {
    const routine = await this.prisma.workoutRoutine.findFirst({
      where: { userId, status: { in: ['generating', 'active', 'failed'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (!routine) throw new NotFoundException('No workout routine yet');

    return toWorkoutRoutine(routine);
  }

  async regenerate(userId: Id): Promise<WorkoutRoutine> {
    const routine = await this.requestGeneration(userId);
    if (!routine) {
      throw new ServiceUnavailableException(
        'Could not start routine generation, please try again',
      );
    }
    return routine;
  }

  /** Home-screen summary for one calendar day: today's slice of the active
   * routine, layered with real steps and completed sets. */
  async getToday(userId: Id, date: IsoDate): Promise<TodayRoutine> {
    const [routineRow, dailySteps] = await Promise.all([
      this.prisma.workoutRoutine.findFirst({
        where: { userId, status: { in: ['generating', 'active', 'failed'] } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dailySteps.findUnique({
        where: { userId_date: { userId, date } },
      }),
    ]);

    const stepsToday = dailySteps?.steps ?? 0;

    if (!routineRow || routineRow.status !== 'active') {
      return {
        routineStatus: routineRow?.status ?? null,
        date,
        dailyCalorieTarget: routineRow?.dailyCalorieTarget ?? undefined,
        exercises: [],
        stepsToday,
        caloriesBurned: 0,
      };
    }

    const routine = toWorkoutRoutine(routineRow);
    const day = routine.days.find((d) => d.dayOfWeek === dayOfWeekOf(date));

    const [completedByExerciseId, thumbnailsByExerciseId] = day
      ? await Promise.all([
          this.todaysCompletedSetsByExercise(userId, date),
          this.thumbnailsFor(
            day.exercises.map((exercise) => exercise.exerciseId),
          ),
        ])
      : [new Map<string, number>(), new Map<string, string>()];
    const exercises = day
      ? this.mergeExerciseProgress(
          day,
          completedByExerciseId,
          thumbnailsByExerciseId,
        )
      : [];

    const caloriesBurned = Math.round(
      exercises.reduce(
        (sum, exercise) =>
          sum +
          (exercise.sets > 0
            ? (exercise.completedSets / exercise.sets) *
              exercise.estimatedCalories
            : 0),
        0,
      ),
    );

    return {
      routineStatus: routine.status,
      date,
      dailyCalorieTarget: routine.dailyCalorieTarget,
      day,
      exercises,
      stepsToday,
      caloriesBurned,
    };
  }

  /** "Today" is approximated as a UTC calendar day, the same no-timezone
   * convention `DailySteps.date` already uses. */
  private async todaysCompletedSetsByExercise(
    userId: Id,
    date: IsoDate,
  ): Promise<Map<string, number>> {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const workouts = await this.prisma.workout.findMany({
      where: { userId, startedAt: { gte: dayStart, lt: dayEnd } },
      select: { exercises: true },
    });

    const completedByExerciseId = new Map<string, number>();
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        const completed = exercise.sets.filter((set) => set.completed).length;
        completedByExerciseId.set(
          exercise.exerciseId,
          (completedByExerciseId.get(exercise.exerciseId) ?? 0) + completed,
        );
      }
    }
    return completedByExerciseId;
  }

  /** Calories credited per day over a date range — the home screen's weekly
   * calorie strip. A day with no matching plan (no active routine, or the
   * routine has nothing for that weekday) reads as 0, not an error. */
  async getCaloriesRange(
    userId: Id,
    from: IsoDate,
    to: IsoDate,
  ): Promise<DailyCaloriesBurned[]> {
    const dates = enumerateDates(from, to);

    const routineRow = await this.prisma.workoutRoutine.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    if (!routineRow) {
      return dates.map((date) => ({
        date,
        caloriesBurned: 0,
        targetCaloriesBurned: 0,
      }));
    }

    const routine = toWorkoutRoutine(routineRow);
    const completedByDate = await this.completedSetsByExerciseForRange(
      userId,
      from,
      to,
    );

    return dates.map((date) => {
      const day = routine.days.find((d) => d.dayOfWeek === dayOfWeekOf(date));
      if (!day) {
        return { date, caloriesBurned: 0, targetCaloriesBurned: 0 };
      }

      const completedByExerciseId =
        completedByDate.get(date) ?? new Map<string, number>();
      const caloriesBurned = Math.round(
        day.exercises.reduce((sum, exercise) => {
          const completed = Math.min(
            completedByExerciseId.get(exercise.exerciseId) ?? 0,
            exercise.sets,
          );
          return (
            sum +
            (exercise.sets > 0
              ? (completed / exercise.sets) * exercise.estimatedCalories
              : 0)
          );
        }, 0),
      );

      return {
        date,
        caloriesBurned,
        targetCaloriesBurned: day.targetCaloriesBurned,
      };
    });
  }

  /** Same idea as `todaysCompletedSetsByExercise`, batched across a range in
   * one query and bucketed by the UTC calendar date each workout falls on. */
  private async completedSetsByExerciseForRange(
    userId: Id,
    from: IsoDate,
    to: IsoDate,
  ): Promise<Map<IsoDate, Map<string, number>>> {
    const rangeStart = new Date(`${from}T00:00:00.000Z`);
    const rangeEnd = new Date(
      new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000,
    );

    const workouts = await this.prisma.workout.findMany({
      where: { userId, startedAt: { gte: rangeStart, lt: rangeEnd } },
      select: { startedAt: true, exercises: true },
    });

    const byDate = new Map<IsoDate, Map<string, number>>();
    for (const workout of workouts) {
      const date = workout.startedAt.toISOString().slice(0, 10);
      const byExercise = byDate.get(date) ?? new Map<string, number>();
      for (const exercise of workout.exercises) {
        const completed = exercise.sets.filter((set) => set.completed).length;
        byExercise.set(
          exercise.exerciseId,
          (byExercise.get(exercise.exerciseId) ?? 0) + completed,
        );
      }
      byDate.set(date, byExercise);
    }
    return byDate;
  }

  /** Shared by the exercise list and the calorie sum, so they can't disagree. */
  private mergeExerciseProgress(
    day: RoutinePlanDay,
    completedByExerciseId: Map<string, number>,
    thumbnailsByExerciseId: Map<string, string>,
  ): TodayRoutineExercise[] {
    return day.exercises.map((exercise) => {
      const completedSets = Math.min(
        completedByExerciseId.get(exercise.exerciseId) ?? 0,
        exercise.sets,
      );
      return {
        ...exercise,
        completedSets,
        isCompleted: exercise.sets > 0 && completedSets >= exercise.sets,
        thumbnail: thumbnailsByExerciseId.get(exercise.exerciseId),
      };
    });
  }

  private async thumbnailsFor(exerciseIds: Id[]): Promise<Map<string, string>> {
    if (exerciseIds.length === 0) return new Map();

    const rows = await this.prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: { id: true, thumbnail: true },
    });

    return new Map(
      rows
        .filter(
          (row): row is typeof row & { thumbnail: string } => !!row.thumbnail,
        )
        .map((row) => [row.id, row.thumbnail]),
    );
  }
}
