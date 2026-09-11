import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DIET_PLAN_INCLUDE,
  WORKOUT_ROUTINE_INCLUDE,
  toDietPlan,
} from '@fitness/db';
import {
  DayOfWeek,
  adaptiveTdee,
  calculateCalorieTarget,
  caloriesForExercise,
  caloriesFromSteps,
  energyProfile,
  yearsSince,
} from '@fitness/types';
import type {
  ActivityLevel,
  CalorieBalance,
  CalorieConfig,
  DietPlanDay,
  ExerciseCategory,
  FitnessGoal,
  Id,
  IntakePoint,
  IsoDate,
  Sex,
  WeightPoint,
} from '@fitness/types';

import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

const DAY_MS = 24 * 60 * 60 * 1000;

const WEEKDAYS: DayOfWeek[] = [
  DayOfWeek.Sunday,
  DayOfWeek.Monday,
  DayOfWeek.Tuesday,
  DayOfWeek.Wednesday,
  DayOfWeek.Thursday,
  DayOfWeek.Friday,
  DayOfWeek.Saturday,
];

function dayOfWeekOf(date: IsoDate): DayOfWeek {
  const jsDay = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return WEEKDAYS[jsDay] ?? DayOfWeek.Sunday;
}

function enumerateDates(from: IsoDate, to: IsoDate): IsoDate[] {
  const start = new Date(`${from}T00:00:00.000Z`).getTime();
  const end = new Date(`${to}T00:00:00.000Z`).getTime();
  const dates: IsoDate[] = [];
  for (let t = start; t <= end; t += DAY_MS) {
    dates.push(new Date(t).toISOString().slice(0, 10));
  }
  return dates;
}

/** Fallback bodyweight when the user has never logged a measurement — only
 * used to scale burn estimates, never to compute a BMR (which stays null). */
const ASSUMED_WEIGHT_KG = 70;

/** History pulled for the adaptive estimate, independent of the range asked
 * for — a single-day request still needs the preceding fortnight of context. */
const ADAPTIVE_LOOKBACK_DAYS = 21;

@Injectable()
export class CaloriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /** One calendar day's full energy balance. */
  async getBalance(userId: Id, date: IsoDate): Promise<CalorieBalance> {
    const [balance] = await this.getRange(userId, date, date);
    if (!balance) throw new NotFoundException('User not found');
    return balance;
  }

  /**
   * Energy balance per day across a range. Everything is loaded once up front
   * and folded per date, so a week costs the same handful of queries a single
   * day does.
   */
  async getRange(
    userId: Id,
    from: IsoDate,
    to: IsoDate,
  ): Promise<CalorieBalance[]> {
    const dates = enumerateDates(from, to);
    const rangeStart = new Date(`${from}T00:00:00.000Z`);
    const rangeEnd = new Date(
      new Date(`${to}T00:00:00.000Z`).getTime() + DAY_MS,
    );

    // The adaptive estimate needs history before `from`, so weights and meal
    // logs are read from further back than the requested range.
    const lookbackStart = new Date(
      rangeStart.getTime() - ADAPTIVE_LOOKBACK_DAYS * DAY_MS,
    );
    const lookbackFrom = lookbackStart.toISOString().slice(0, 10);

    const [
      user,
      weightRows,
      steps,
      mealLogs,
      dietPlanRow,
      routineRow,
      workouts,
      settings,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { profile: true },
      }),
      this.prisma.bodyMeasurement.findMany({
        where: {
          userId,
          weightKg: { not: null },
          recordedAt: { gte: lookbackStart },
        },
        orderBy: { recordedAt: 'asc' },
        select: { recordedAt: true, weightKg: true },
      }),
      this.prisma.dailySteps.findMany({
        where: { userId, date: { gte: from, lte: to } },
        select: { date: true, steps: true },
      }),
      this.prisma.dailyMealLog.findMany({
        where: { userId, date: { gte: lookbackFrom, lte: to } },
        select: { date: true, takenItemIds: true, extraItems: true },
      }),
      this.prisma.dietPlan.findFirst({
        where: { userId, status: 'active' },
        orderBy: { createdAt: 'desc' },
        include: DIET_PLAN_INCLUDE,
      }),
      this.prisma.workoutRoutine.findFirst({
        where: { userId, status: 'active' },
        orderBy: { createdAt: 'desc' },
        include: WORKOUT_ROUTINE_INCLUDE,
      }),
      this.prisma.workout.findMany({
        where: { userId, startedAt: { gte: rangeStart, lt: rangeEnd } },
        select: { startedAt: true, exercises: true },
      }),
      this.settings.get(),
    ]);

    if (!user) throw new NotFoundException('User not found');

    const config = settings.calorieConfig;
    const weightHistory: WeightPoint[] = weightRows
      .filter(
        (row): row is typeof row & { weightKg: number } =>
          row.weightKg !== null,
      )
      .map((row) => ({
        date: row.recordedAt.toISOString().slice(0, 10),
        weightKg: row.weightKg,
      }));
    const weightKg = weightHistory.at(-1)?.weightKg ?? null;
    const resting = restingRates(user.profile, weightKg, config);

    const stepsByDate = new Map(steps.map((row) => [row.date, row.steps]));
    const takenByDate = new Map(
      mealLogs.map((row) => [row.date, new Set(row.takenItemIds)]),
    );
    // Off-plan food logged by portion, summed per date and added to intake —
    // without this, quick-logged food would not move the balance at all.
    const extrasByDate = new Map(
      mealLogs.map((row) => [row.date, sumExtras(row.extraItems)]),
    );

    const dietDays = dietPlanRow ? toDietPlan(dietPlanRow).days : [];
    const dietDayByWeekday = new Map(
      dietDays.map((day) => [day.dayOfWeek, day]),
    );

    const categories = await this.categoriesFor(routineRow, workouts);
    const burnedByDate = this.burnedByDate(
      workouts,
      categories,
      weightKg ?? ASSUMED_WEIGHT_KG,
      config,
    );

    // Intake per day across the whole lookback, so the adaptive estimate has
    // history even when only one day was requested.
    const intakeHistory: IntakePoint[] = [...takenByDate.keys()]
      .sort()
      .map((date) => ({
        date,
        calories:
          sumConsumed(
            dietDayByWeekday.get(dayOfWeekOf(date)),
            takenByDate.get(date),
          ).consumedCalories + (extrasByDate.get(date)?.consumedCalories ?? 0),
      }));

    const adaptive = adaptiveTdee(resting.tdee, weightHistory, intakeHistory);

    // Once measured expenditure is available it replaces the formula figure,
    // and the intake target is re-derived from it.
    const effectiveTdee = adaptive.tdee;
    const effectiveTarget =
      adaptive.isAdaptive && effectiveTdee !== null && user.profile.sex
        ? calculateCalorieTarget(
            effectiveTdee,
            user.profile.fitnessGoals ?? [],
            user.profile.sex,
            config,
          )
        : resting.targetCalories;

    return dates.map((date) => {
      const consumed = addConsumed(
        sumConsumed(
          dietDayByWeekday.get(dayOfWeekOf(date)),
          takenByDate.get(date),
        ),
        extrasByDate.get(date),
      );

      const burnedFromExercise = burnedByDate.get(date) ?? 0;
      const burnedFromSteps = caloriesFromSteps(
        stepsByDate.get(date) ?? 0,
        weightKg ?? ASSUMED_WEIGHT_KG,
        config,
      );
      const burnedTotal = burnedFromExercise + burnedFromSteps;

      return {
        date,
        bmr: resting.bmr,
        tdee: effectiveTdee,
        targetCalories: effectiveTarget,
        ...consumed,
        burnedFromExercise,
        burnedFromSteps,
        burnedTotal,
        netCalories:
          effectiveTdee === null
            ? null
            : consumed.consumedCalories - (effectiveTdee + burnedTotal),
        remainingCalories:
          effectiveTarget === null
            ? null
            : Math.max(effectiveTarget - consumed.consumedCalories, 0),
        adaptive,
      };
    });
  }

  /**
   * Exercise categories for every exercise logged in the range, so burn can be
   * MET-scored. Also covers the routine's own exercises so a plan referencing
   * a since-edited catalogue entry still scores rather than silently reading 0.
   */
  private async categoriesFor(
    routineRow: { days: { exercises: { exerciseId: string }[] }[] } | null,
    workouts: { exercises: { exerciseId: string }[] }[],
  ): Promise<Map<string, ExerciseCategory>> {
    const ids = [
      ...new Set([
        ...workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId)),
        ...(routineRow?.days.flatMap((d) =>
          d.exercises.map((e) => e.exerciseId),
        ) ?? []),
      ]),
    ];

    if (ids.length === 0) return new Map();

    const rows = await this.prisma.exercise.findMany({
      where: { id: { in: ids } },
      select: { id: true, category: true },
    });

    return new Map(rows.map((row) => [row.id, row.category]));
  }

  /**
   * MET-scored burn per calendar day, counting only completed sets. Replaces
   * the model-invented `estimatedCalories` that used to drive this number.
   */
  private burnedByDate(
    workouts: { startedAt: Date; exercises: WorkoutExerciseRow[] }[],
    categories: Map<string, ExerciseCategory>,
    weightKg: number,
    config: CalorieConfig | undefined,
  ): Map<IsoDate, number> {
    const byDate = new Map<IsoDate, number>();

    for (const workout of workouts) {
      const date = workout.startedAt.toISOString().slice(0, 10);
      let total = byDate.get(date) ?? 0;

      for (const exercise of workout.exercises) {
        const completed = exercise.sets.filter((set) => set.completed);
        if (completed.length === 0) continue;

        const category = categories.get(exercise.exerciseId) ?? 'reps';

        const durationSec = completed.reduce(
          (sum, set) => sum + (set.durationSec ?? 0),
          0,
        );
        const reps = completed.reduce((sum, set) => sum + (set.reps ?? 0), 0);

        total += caloriesForExercise(
          {
            category,
            weightKg,
            sets: completed.length,
            reps: reps > 0 ? Math.round(reps / completed.length) : undefined,
            durationSec: durationSec > 0 ? durationSec : undefined,
            restSeconds: exercise.restSeconds ?? undefined,
          },
          config,
        );
      }

      byDate.set(date, total);
    }

    return byDate;
  }
}

interface WorkoutExerciseRow {
  exerciseId: string;
  restSeconds?: number | null;
  sets: {
    completed: boolean;
    reps?: number | null;
    durationSec?: number | null;
  }[];
}

/** Prisma reads absent profile fields back as `null`, not `undefined`. */
interface ProfileRow {
  dateOfBirth: string | null;
  sex: Sex | null;
  heightCm: number | null;
  activityLevel: ActivityLevel | null;
  fitnessGoals: FitnessGoal[];
}

function restingRates(
  profile: ProfileRow,
  weightKg: number | null,
  config: CalorieConfig | undefined,
) {
  return energyProfile(
    {
      weightKg,
      heightCm: profile.heightCm,
      ageYears: profile.dateOfBirth ? yearsSince(profile.dateOfBirth) : null,
      sex: profile.sex,
      activityLevel: profile.activityLevel,
      fitnessGoals: profile.fitnessGoals,
    },
    config,
  );
}

interface Consumed {
  consumedCalories: number;
  consumedProteinG: number;
  consumedFatG: number;
  consumedCarbsG: number;
}

const EMPTY_CONSUMED: Consumed = {
  consumedCalories: 0,
  consumedProteinG: 0,
  consumedFatG: 0,
  consumedCarbsG: 0,
};

/** Macros from off-plan food logged by household portion. */
function sumExtras(
  entries: readonly {
    calories: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
  }[],
): Consumed {
  return entries.reduce(
    (acc, entry) => ({
      consumedCalories: acc.consumedCalories + entry.calories,
      consumedProteinG: acc.consumedProteinG + entry.proteinG,
      consumedFatG: acc.consumedFatG + entry.fatG,
      consumedCarbsG: acc.consumedCarbsG + entry.carbsG,
    }),
    EMPTY_CONSUMED,
  );
}

function addConsumed(a: Consumed, b: Consumed | undefined): Consumed {
  if (!b) return a;
  return {
    consumedCalories: a.consumedCalories + b.consumedCalories,
    consumedProteinG: a.consumedProteinG + b.consumedProteinG,
    consumedFatG: a.consumedFatG + b.consumedFatG,
    consumedCarbsG: a.consumedCarbsG + b.consumedCarbsG,
  };
}

/** Macros from the items the user actually ticked off in today's plan. */
function sumConsumed(
  day: DietPlanDay | undefined,
  takenItemIds: Set<string> | undefined,
): {
  consumedCalories: number;
  consumedProteinG: number;
  consumedFatG: number;
  consumedCarbsG: number;
} {
  const empty = {
    consumedCalories: 0,
    consumedProteinG: 0,
    consumedFatG: 0,
    consumedCarbsG: 0,
  };

  if (!day || !takenItemIds || takenItemIds.size === 0) return empty;

  return day.meals
    .flatMap((meal) => meal.items)
    .filter((item) => takenItemIds.has(item.id))
    .reduce(
      (acc, item) => ({
        consumedCalories: acc.consumedCalories + item.calories,
        consumedProteinG: acc.consumedProteinG + item.proteinG,
        consumedFatG: acc.consumedFatG + item.fatG,
        consumedCarbsG: acc.consumedCarbsG + item.carbsG,
      }),
      empty,
    );
}
