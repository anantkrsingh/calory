import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DIET_PLAN_INCLUDE, toDietPlan } from '@fitness/db';
import { DayOfWeek } from '@fitness/types';
import type {
  DietPlan,
  DietPlanPreferences,
  Id,
  IsoDate,
  TodayDiet,
} from '@fitness/types';
import type {
  GenerateDietPlanInput,
  MarkDietItemsTakenInput,
} from '@fitness/validation';

import { resolveDietCuisine } from './geo-cuisine';
import { PrismaService } from '../prisma/prisma.service';
import { DietPlanQueue } from '../queues/diet-plan.queue';

const WEEKDAYS: DayOfWeek[] = [
  DayOfWeek.Sunday,
  DayOfWeek.Monday,
  DayOfWeek.Tuesday,
  DayOfWeek.Wednesday,
  DayOfWeek.Thursday,
  DayOfWeek.Friday,
  DayOfWeek.Saturday,
];

/** ISO date (`YYYY-MM-DD`) → weekday, matching `DietPlanDay.dayOfWeek`. */
function dayOfWeekOf(date: IsoDate): DayOfWeek {
  const jsDay = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return WEEKDAYS[jsDay] ?? DayOfWeek.Sunday;
}

@Injectable()
export class DietPlansService {
  private readonly logger = new Logger(DietPlansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: DietPlanQueue,
  ) {}

  /**
   * Never auto-triggered (unlike `WorkoutRoutineService.requestGeneration`
   * at registration) — a diet plan only exists once the user asks for one,
   * via the "Create my diet plan" button or the chat agent's tool call, both
   * of which land on `regenerate` below whether or not they already have one.
   */
  async requestGeneration(
    userId: Id,
    preferences: DietPlanPreferences,
  ): Promise<DietPlan | null> {
    try {
      const plan = await this.prisma.dietPlan.create({
        data: { userId, status: 'generating', ...preferences },
        include: DIET_PLAN_INCLUDE,
      });

      const job = await this.queue.generate({
        userId,
        dietPlanId: plan.id,
        preferences,
      });

      if (!job) {
        await this.prisma.dietPlan.update({
          where: { id: plan.id },
          data: { status: 'failed', error: 'Could not queue generation job' },
        });
        return null;
      }

      // Only retire the previous plan once the new job is safely queued.
      await this.prisma.dietPlan.updateMany({
        where: {
          userId,
          id: { not: plan.id },
          status: { in: ['generating', 'active'] },
        },
        data: { status: 'superseded' },
      });

      return toDietPlan(plan);
    } catch (error) {
      this.logger.error(
        `Could not request diet plan generation for ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  /**
   * `input.cuisine` is only ever set by an explicit user/chat-agent choice —
   * when omitted, it's resolved here from `clientIp` (see `resolveDietCuisine`)
   * so every generated plan has a concrete cuisine, never "unset".
   */
  async regenerate(
    userId: Id,
    input: GenerateDietPlanInput,
    clientIp: string | undefined,
  ): Promise<DietPlan> {
    const preferences: DietPlanPreferences = {
      dietTypes: input.dietTypes,
      cuisine: input.cuisine ?? resolveDietCuisine(clientIp),
      exclude: input.exclude,
      mealsPerDay: input.mealsPerDay,
    };

    const plan = await this.requestGeneration(userId, preferences);
    if (!plan) {
      throw new ServiceUnavailableException(
        'Could not start diet plan generation, please try again',
      );
    }
    return plan;
  }

  /** The newest plan that is still generating, active or failed. */
  async findCurrent(userId: Id): Promise<DietPlan> {
    const plan = await this.prisma.dietPlan.findFirst({
      where: { userId, status: { in: ['generating', 'active', 'failed'] } },
      orderBy: { createdAt: 'desc' },
      include: DIET_PLAN_INCLUDE,
    });

    if (!plan) throw new NotFoundException('No diet plan yet');

    return toDietPlan(plan);
  }

  /** Today's slice of the active plan, layered with which items the user has
   * actually marked taken on this calendar date. */
  async getToday(userId: Id, date: IsoDate): Promise<TodayDiet> {
    const [planRow, log] = await Promise.all([
      this.prisma.dietPlan.findFirst({
        where: { userId, status: { in: ['generating', 'active', 'failed'] } },
        orderBy: { createdAt: 'desc' },
        include: DIET_PLAN_INCLUDE,
      }),
      this.prisma.dailyMealLog.findUnique({
        where: { userId_date: { userId, date } },
      }),
    ]);

    const takenItemIds = log?.takenItemIds ?? [];

    if (!planRow || planRow.status !== 'active') {
      return { planStatus: planRow?.status ?? null, date, takenItemIds };
    }

    const plan = toDietPlan(planRow);
    const day = plan.days.find((d) => d.dayOfWeek === dayOfWeekOf(date));

    return { planStatus: plan.status, date, day, takenItemIds };
  }

  /**
   * Marks one item taken/untaken for `date`, or — with no `itemId` — every
   * item in the meal at once. Read-modify-write on `DailyMealLog`, same
   * convention `ExercisesService` uses for `User.favoriteExerciseIds`.
   */
  async markTaken(
    userId: Id,
    date: IsoDate,
    input: MarkDietItemsTakenInput,
  ): Promise<TodayDiet> {
    const planRow = await this.prisma.dietPlan.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: DIET_PLAN_INCLUDE,
    });
    if (!planRow) throw new NotFoundException('No active diet plan');

    const day = planRow.days.find((d) => d.dayOfWeek === dayOfWeekOf(date));
    const meal = day?.meals.find((m) => m.id === input.mealId);
    if (!meal) {
      throw new NotFoundException(`Meal not found in today's plan`);
    }

    if (input.itemId && !meal.items.some((item) => item.id === input.itemId)) {
      throw new NotFoundException(`Item not found in that meal`);
    }

    const targetIds = input.itemId
      ? [input.itemId]
      : meal.items.map((item) => item.id);

    const log = await this.prisma.dailyMealLog.findUnique({
      where: { userId_date: { userId, date } },
    });
    const current = new Set(log?.takenItemIds ?? []);
    for (const id of targetIds) {
      if (input.taken) current.add(id);
      else current.delete(id);
    }

    await this.prisma.dailyMealLog.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, takenItemIds: Array.from(current) },
      update: { takenItemIds: Array.from(current) },
    });

    return this.getToday(userId, date);
  }
}
