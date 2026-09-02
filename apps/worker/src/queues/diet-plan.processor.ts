import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { resolvePrompt, weeklyDietSchema } from '@fitness/ai';
import type { WeeklyDiet } from '@fitness/ai';
import {
  DIET_PLAN_QUEUE_NAME,
  type DayOfWeek,
  type DietPlanJobData,
  type DietPlanJobResult,
} from '@fitness/types';
import {
  generateObject,
  generateText,
  NoObjectGeneratedError,
  stepCountIs,
  tool,
  type LanguageModel,
  type LanguageModelUsage,
} from 'ai';
import { Worker, type Job } from 'bullmq';
import { z } from 'zod';

import { AI_MODEL } from '../ai/ai.module';
import { ENV, type Env } from '../config/env.module';
import { PrismaService } from '../prisma/prisma.service';

// A full 7-day meal plan is a large structured object; too low a cap here
// reads as a schema-validation failure (truncated JSON), not a token-limit
// one — same reasoning as the routine generator's budget.
const DIET_OBJECT_MAX_OUTPUT_TOKENS = 16000;
// Give the repair attempt even more headroom — a truncated first attempt
// means the budget above wasn't enough.
const DIET_OBJECT_REPAIR_MAX_OUTPUT_TOKENS = 24000;

const yearsSince = (isoDate: string): number | null => {
  const born = new Date(isoDate);
  if (Number.isNaN(born.getTime())) return null;
  const ms = Date.now() - born.getTime();
  return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
};

/** Standard BMI = kg / m^2, rounded to one decimal. */
const calculateBmi = (heightCm: number, weightKg: number): number => {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
};

const bmiCategory = (bmi: number): string => {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
};

type PersistedDietItem = {
  order: number;
  name: string;
  description: string | null;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

type PersistedDietMeal = {
  order: number;
  name: string;
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbsG: number;
  items: PersistedDietItem[];
};

type PersistedDietDay = {
  order: number;
  dayOfWeek: DayOfWeek;
  targetCalories: number;
  targetProteinG: number | null;
  targetFatG: number | null;
  targetCarbsG: number | null;
  meals: PersistedDietMeal[];
};

@Injectable()
export class DietPlanProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DietPlanProcessor.name);
  private worker?: Worker<DietPlanJobData, DietPlanJobResult>;

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(AI_MODEL) private readonly model: LanguageModel | null,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    const connection = {
      host: this.env.REDIS_HOST,
      port: this.env.REDIS_PORT,
      password: this.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    };

    this.worker = new Worker<DietPlanJobData, DietPlanJobResult>(
      DIET_PLAN_QUEUE_NAME,
      (job) => this.handle(job),
      { connection, prefix: 'fitness' },
    );

    this.worker.on('failed', (job, error) => {
      const maxAttempts = job?.opts.attempts ?? 1;
      this.logger.error(
        `Diet plan job ${job?.id} (plan ${job?.data.dietPlanId}, user ${job?.data.userId}) ` +
          `failed on attempt ${job?.attemptsMade}/${maxAttempts}: ${error.message}`,
        error.stack,
      );

      // Only give up once BullMQ has exhausted its retries.
      const exhausted = !job || job.attemptsMade >= maxAttempts;
      if (exhausted) void this.markFailed(job?.data.dietPlanId, error.message);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  private async markFailed(
    dietPlanId: string | undefined,
    error: string,
  ): Promise<void> {
    if (!dietPlanId) return;
    try {
      // updateMany so a superseded or already-active plan is left alone.
      await this.prisma.dietPlan.updateMany({
        where: { id: dietPlanId, status: 'generating' },
        data: { status: 'failed', error: error.slice(0, 500) },
      });
    } catch (cause) {
      this.logger.error(
        `Could not mark diet plan ${dietPlanId} failed: ${
          cause instanceof Error ? cause.message : String(cause)
        }`,
      );
    }
  }

  private userDetailsTool(userId: string) {
    return tool({
      description:
        'Get the profile of the user this diet is for: age, sex, height, ' +
        'weight, BMI, activity level and their chosen fitness goals.',
      inputSchema: z.object({}),
      execute: async () => {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user) throw new Error('User no longer exists');

        const latest = await this.prisma.bodyMeasurement.findFirst({
          where: { userId },
          orderBy: { recordedAt: 'desc' },
        });

        const heightCm = user.profile.heightCm ?? null;
        const weightKg = latest?.weightKg ?? null;
        const bmi =
          heightCm && weightKg ? calculateBmi(heightCm, weightKg) : null;

        return {
          displayName: user.profile.displayName,
          ageYears: user.profile.dateOfBirth
            ? yearsSince(user.profile.dateOfBirth)
            : null,
          sex: user.profile.sex ?? null,
          heightCm,
          activityLevel: user.profile.activityLevel ?? null,
          fitnessGoals: user.profile.fitnessGoals,
          weightKg,
          bodyFatPercentage: latest?.bodyFatPercentage ?? null,
          bmi,
          bmiCategory: bmi ? bmiCategory(bmi) : null,
          units: user.preferences.units,
        };
      },
    });
  }

  private async handle(job: Job<DietPlanJobData>): Promise<DietPlanJobResult> {
    const { userId, dietPlanId } = job.data;
    const startedAt = Date.now();
    const tag = `Diet plan ${dietPlanId} (user ${userId}, job ${job.id}, attempt ${job.attemptsMade + 1})`;

    this.logger.log(`${tag}: starting generation`);

    if (!this.model) {
      throw new Error(
        'No LLM provider configured; cannot generate a diet plan',
      );
    }

    const plan = await this.prisma.dietPlan.findUnique({
      where: { id: dietPlanId },
    });

    if (!plan) throw new Error(`Diet plan ${dietPlanId} no longer exists`);
    if (plan.status === 'superseded') {
      this.logger.log(`${tag}: already superseded, skipping`);
      return { dietPlanId, status: 'superseded' };
    }

    const settings = await this.prisma.appSettings.findFirst();
    const prompt = resolvePrompt('diet_plan', settings?.aiPrompts);
    const usesAdminPrompt =
      settings?.aiPrompts?.some((p) => p.promptCategory === 'diet_plan') ??
      false;
    this.logger.log(
      `${tag}: resolved ${usesAdminPrompt ? 'admin-configured' : 'default'} prompt (${prompt.length} chars)`,
    );

    // generateObject takes no tools, so gather context first, then structure it.
    this.logger.log(`${tag}: gathering context via tools`);
    const research = await generateText({
      model: this.model,
      prompt: `${prompt}\n\nCall the tools to gather what you need, then outline the week in plain text.`,
      tools: { getUserDetails: this.userDetailsTool(userId) },
      stopWhen: stepCountIs(3),
      // This is tool-calling + a plain-text summary, not a hard reasoning
      // task — skip reasoning entirely so it can't eat its own output budget
      // on invisible reasoning tokens. Ignored by non-reasoning models.
      providerOptions: { openai: { reasoningEffort: 'minimal' } },
    });

    const toolCalls = research.steps.flatMap((step) => step.toolCalls);
    this.logger.log(
      `${tag}: research complete — ${research.steps.length} step(s), ` +
        `${toolCalls.map((c) => c.toolName).join(', ') || 'no tool calls'}, ` +
        `${research.usage?.totalTokens ?? '?'} tokens`,
    );

    const toolContext = research.steps
      .flatMap((step) => step.toolResults)
      .map((result) => `${result.toolName}: ${JSON.stringify(result.output)}`)
      .join('\n');

    const objectPrompt = [
      prompt,
      '',
      'Data retrieved for this user:',
      toolContext || '(no tool data available)',
      '',
      research.text,
    ].join('\n');

    const { object, usage } = await this.generateWeeklyDiet(
      this.model,
      objectPrompt,
      tag,
    );

    const totalItems = object.days.reduce(
      (sum, d) => sum + d.meals.reduce((s, m) => s + m.items.length, 0),
      0,
    );
    this.logger.log(
      `${tag}: plan generated — ${object.days.length} day(s), ${totalItems} item(s), ` +
        `${usage?.totalTokens ?? '?'} tokens`,
    );

    const days: PersistedDietDay[] = object.days.map((day, dayIndex) => {
      const meals: PersistedDietMeal[] = day.meals.map((meal, mealIndex) => {
        const items: PersistedDietItem[] = meal.items.map(
          (item, itemIndex) => ({
            order: itemIndex,
            name: item.name,
            description: item.description || null,
            calories: item.calories,
            proteinG: item.proteinG,
            fatG: item.fatG,
            carbsG: item.carbsG,
          }),
        );

        const totals = items.reduce(
          (acc, item) => ({
            calories: acc.calories + item.calories,
            proteinG: acc.proteinG + item.proteinG,
            fatG: acc.fatG + item.fatG,
            carbsG: acc.carbsG + item.carbsG,
          }),
          { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 },
        );

        return {
          order: mealIndex,
          name: meal.name,
          totalCalories: totals.calories,
          totalProteinG: totals.proteinG,
          totalFatG: totals.fatG,
          totalCarbsG: totals.carbsG,
          items,
        };
      });

      return {
        order: dayIndex,
        dayOfWeek: day.dayOfWeek,
        targetCalories: day.targetCalories,
        targetProteinG: day.targetProteinG ?? null,
        targetFatG: day.targetFatG ?? null,
        targetCarbsG: day.targetCarbsG ?? null,
        meals,
      };
    });

    // Claim the plan first — guards against a concurrent supersede, same as
    // before normalization. Only once that succeeds do we touch
    // DietDay/DietMeal/DietMealItem, so a lost race never leaves half-written
    // days behind.
    const { count } = await this.prisma.dietPlan.updateMany({
      where: { id: dietPlanId, status: 'generating' },
      data: {
        status: 'active',
        summary: object.summary,
        error: null,
        generatedAt: new Date(),
      },
    });

    if (count === 0) {
      const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
      this.logger.log(
        `${tag}: superseded mid-generation after ${elapsedSec}s, discarding result`,
      );
      return { dietPlanId, status: 'superseded' };
    }

    await this.replaceDays(dietPlanId, days);

    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
    this.logger.log(`${tag}: generated and saved in ${elapsedSec}s`);

    return { dietPlanId, status: 'active' };
  }

  /**
   * Replaces every DietDay (and DietMeal/DietMealItem) for a plan with a
   * freshly generated week — a regenerate is a full rewrite conceptually, so
   * delete-then-recreate is simpler and safer than diffing the old plan.
   * Deletes explicitly rather than relying on `onDelete: Cascade` alone —
   * same explicit-over-emulated convention as `RoutineProcessor.replaceDays`.
   */
  private async replaceDays(
    dietPlanId: string,
    days: PersistedDietDay[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existingDayIds = (
        await tx.dietDay.findMany({
          where: { dietPlanId },
          select: { id: true },
        })
      ).map((d) => d.id);

      if (existingDayIds.length > 0) {
        const existingMealIds = (
          await tx.dietMeal.findMany({
            where: { dayId: { in: existingDayIds } },
            select: { id: true },
          })
        ).map((m) => m.id);

        if (existingMealIds.length > 0) {
          await tx.dietMealItem.deleteMany({
            where: { mealId: { in: existingMealIds } },
          });
          await tx.dietMeal.deleteMany({
            where: { dayId: { in: existingDayIds } },
          });
        }
        await tx.dietDay.deleteMany({ where: { dietPlanId } });
      }

      for (const { meals, ...day } of days) {
        await tx.dietDay.create({
          data: {
            ...day,
            dietPlanId,
            meals: {
              create: meals.map(({ items, ...meal }) => ({
                ...meal,
                items: { create: items },
              })),
            },
          },
        });
      }
    });
  }

  private async generateWeeklyDiet(
    model: LanguageModel,
    prompt: string,
    tag: string,
  ): Promise<{ object: WeeklyDiet; usage: LanguageModelUsage | undefined }> {
    try {
      return await generateObject({
        model,
        schema: weeklyDietSchema,
        prompt,
        maxOutputTokens: DIET_OBJECT_MAX_OUTPUT_TOKENS,
        // Skip reasoning so a big schema doesn't get the whole output budget
        // spent on invisible reasoning tokens before any JSON comes out
        // (that's what `finishReason: 'length'` with 0 chars means). Ignored
        // by non-reasoning models.
        providerOptions: { openai: { reasoningEffort: 'minimal' } },
      });
    } catch (error) {
      if (!NoObjectGeneratedError.isInstance(error)) throw error;

      // `length` means it ran out of output budget mid-object — there's no
      // Zod cause to repair, it just needs more room and to be more terse.
      const truncated = error.finishReason === 'length';
      const causeMessage =
        error.cause instanceof Error ? error.cause.message : undefined;

      this.logger.warn(
        `${tag}: model output did not match schema (finishReason=${error.finishReason}, ` +
          `${error.usage?.totalTokens ?? '?'} tokens, ${error.text?.length ?? 0} chars) — ` +
          `retrying once with ${truncated ? 'a larger token budget' : 'a repair prompt'}.` +
          (causeMessage ? ` Cause: ${causeMessage}` : ''),
      );

      return generateObject({
        model,
        schema: weeklyDietSchema,
        prompt: truncated
          ? [
              prompt,
              '',
              'Your previous response was cut off before it finished (ran out ' +
                'of output budget). Produce the same response again, but keep ' +
                'text terse so the full JSON fits.',
            ].join('\n')
          : [
              prompt,
              '',
              'Your previous response did not satisfy the required schema:',
              causeMessage ?? 'unknown validation error',
              '',
              'Produce a corrected response that satisfies every field exactly.',
            ].join('\n'),
        maxOutputTokens: DIET_OBJECT_REPAIR_MAX_OUTPUT_TOKENS,
        providerOptions: { openai: { reasoningEffort: 'minimal' } },
      });
    }
  }
}
