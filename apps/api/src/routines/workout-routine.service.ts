import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { toWorkoutRoutine } from '@fitness/db';
import type {
  Id,
  IsoDate,
  RoutinePlanDay,
  TodayRoutine,
  WorkoutRoutine,
} from '@fitness/types';

import { PrismaService } from '../prisma/prisma.service';
import { RoutineQueue } from '../queues/routine.queue';

/** ISO date (`YYYY-MM-DD`) → 1 = Monday .. 7 = Sunday, matching `RoutinePlanDay.dayOfWeek`. */
function dayOfWeekOf(date: IsoDate): number {
  const jsDay = new Date(`${date}T00:00:00.000Z`).getUTCDay(); // 0 = Sunday
  return jsDay === 0 ? 7 : jsDay;
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

  /**
   * Home-screen summary for one calendar day: today's slice of the active
   * routine, layered with the real step count and completed sets logged so
   * far — turning the AI's per-exercise `estimatedCalories` and per-step
   * `caloriesPerStep` into an actual calories-burned-so-far number.
   */
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
        stepsToday,
        caloriesBurned: { fromSteps: 0, fromExercises: 0, total: 0 },
      };
    }

    const routine = toWorkoutRoutine(routineRow);
    const day = routine.days.find((d) => d.dayOfWeek === dayOfWeekOf(date));

    const fromSteps = routine.caloriesPerStep
      ? Math.round(stepsToday * routine.caloriesPerStep)
      : 0;
    const fromExercises = day
      ? await this.exerciseCaloriesEarned(userId, date, day)
      : 0;

    return {
      routineStatus: routine.status,
      date,
      dailyCalorieTarget: routine.dailyCalorieTarget,
      day,
      stepsToday,
      caloriesBurned: {
        fromSteps,
        fromExercises,
        total: fromSteps + fromExercises,
      },
    };
  }

  /**
   * Sums each planned exercise's `estimatedCalories`, credited in proportion
   * to how many of its prescribed sets were actually logged as completed
   * today — so half the sets earns half the calories.
   *
   * "Today" is approximated as a UTC calendar day, the same no-timezone
   * convention `DailySteps.date` already uses.
   */
  private async exerciseCaloriesEarned(
    userId: Id,
    date: IsoDate,
    day: RoutinePlanDay,
  ): Promise<number> {
    if (day.exercises.length === 0) return 0;

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const workouts = await this.prisma.workout.findMany({
      where: { userId, startedAt: { gte: dayStart, lt: dayEnd } },
      select: { exercises: true },
    });

    const planned = new Map(day.exercises.map((e) => [e.exerciseId, e]));
    let earned = 0;

    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        const target = planned.get(exercise.exerciseId);
        if (!target || target.sets <= 0) continue;

        const completedSets = exercise.sets.filter((set) => set.completed).length;
        const ratio = Math.min(1, completedSets / target.sets);
        earned += ratio * target.estimatedCalories;
      }
    }

    return Math.round(earned);
  }
}
