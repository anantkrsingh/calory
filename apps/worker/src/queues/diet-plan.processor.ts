import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import {
  resolveModelConfig,
  resolvePrompt,
  weeklyDietSchema,
} from '@fitness/ai';
import { toCalorieConfig } from '@fitness/db';
import type { WeeklyDiet } from '@fitness/ai';
import {
  DIET_PLAN_QUEUE_NAME,
  PromptCategory,
  bmiCategory,
  calculateBmi,
  energyProfile,
  yearsSince,
  type Citation,
  type DayOfWeek,
  type DietCuisine,
  type DietPlanJobData,
  type DietPlanJobResult,
  type DietType,
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

import {
  AI_MODEL_RESOLVER,
  AI_SEARCH_TOOL_RESOLVER,
  type AiModelResolver,
  type AiSearchToolResolver,
} from '../ai/ai.module';
import { ENV, type Env } from '../config/env.module';
import { PrismaService } from '../prisma/prisma.service';

// A full 7-day meal plan is a large structured object — one level deeper
// than the routine generator's (days -> meals -> items, vs. days ->
// exercises), so it gets a bigger budget. Too low a cap here reads as a
// schema-validation failure (truncated JSON), not a token-limit one.
// A little extra headroom over the routine generator's cap accounts for the
// per-meal `citations` field on top of the macro fields.
const DIET_OBJECT_MAX_OUTPUT_TOKENS = 23000;
// Give the repair attempt even more headroom — a truncated first attempt
// means the budget above wasn't enough.
const DIET_OBJECT_REPAIR_MAX_OUTPUT_TOKENS = 32000;
// Distinct sources kept from research, across every day's search results —
// caps how many candidates the object step has to choose citations from.
const MAX_CITATION_SOURCES = 12;

const DIET_TYPE_LABEL: Record<DietType, string> = {
  veg: 'Vegetarian (no meat or fish; eggs/dairy are fine)',
  non_veg: 'Non-vegetarian (meat, fish, eggs and dairy all allowed)',
  vegan: 'Vegan — strictly plant-based: no meat, fish, eggs, dairy or honey',
};

const CUISINE_LABEL: Record<DietCuisine, string> = {
  indian: 'Indian',
  italian: 'Italian',
  chinese: 'Chinese',
  continental: 'Continental (general Western/European)',
  mexican: 'Mexican',
  american: 'American',
};

/**
 * Renders the user's chosen generation options as directives the model must
 * follow — these come from `generateDietPlanSchema` (via `DietPlansService`)
 * and override anything the base prompt says about diet, region or meal
 * count, since the admin-configured prompt has no way to know them.
 */
function formatDietPreferences(plan: {
  dietTypes: DietType[];
  cuisine: DietCuisine;
  exclude: string[];
  mealsPerDay: number;
}): string {
  const dietLine = plan.dietTypes
    .map((type) => DIET_TYPE_LABEL[type])
    .join(' and ');

  return [
    'The user has chosen these options for THIS plan — they override any',
    'general diet/region/meal-count guidance above:',
    `- Diet: ${dietLine}`,
    `- Cuisine: ${CUISINE_LABEL[plan.cuisine]} — every meal should draw on this cuisine's ` +
      'typical dishes and ingredients.',
    plan.exclude.length > 0
      ? `- Never include, in any form: ${plan.exclude.join(', ')}.`
      : '- No excluded foods.',
    `- Exactly ${plan.mealsPerDay} meals every day, no more and no fewer.`,
  ].join('\n');
}

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
  citations: Citation[];
};

/** Real sources (Google Search grounding) gathered across every research
 * step, deduped by url and capped at `MAX_CITATION_SOURCES`. Only the `url`
 * source type carries a real link — other source types `Source` also allows
 * are skipped. */
function dedupeSources(sources: readonly unknown[]): Citation[] {
  const byUrl = new Map<string, Citation>();
  for (const source of sources) {
    if (typeof source !== 'object' || source === null) continue;
    const { sourceType, url, title } = source as Record<string, unknown>;
    if (sourceType !== 'url' || typeof url !== 'string' || byUrl.has(url)) {
      continue;
    }
    byUrl.set(url, {
      title: typeof title === 'string' && title.trim() ? title.trim() : url,
      url,
    });
    if (byUrl.size >= MAX_CITATION_SOURCES) break;
  }
  return Array.from(byUrl.values());
}

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
    @Inject(AI_MODEL_RESOLVER) private readonly resolveModel: AiModelResolver,
    @Inject(AI_SEARCH_TOOL_RESOLVER)
    private readonly resolveSearchTool: AiSearchToolResolver,
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
        'weight, BMI, activity level, their chosen fitness goals, and their ' +
        'computed BMR, TDEE and dailyCalorieTarget.',
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
        const ageYears = user.profile.dateOfBirth
          ? yearsSince(user.profile.dateOfBirth)
          : null;
        const bmi =
          heightCm && weightKg ? calculateBmi(heightCm, weightKg) : null;
        const settings = await this.prisma.appSettings.findFirst();
        const energy = energyProfile(
          {
            weightKg,
            heightCm,
            ageYears,
            sex: user.profile.sex ?? null,
            activityLevel: user.profile.activityLevel ?? null,
            fitnessGoals: user.profile.fitnessGoals,
          },
          toCalorieConfig(settings?.calorieConfig),
        );

        return {
          displayName: user.profile.displayName,
          ageYears,
          sex: user.profile.sex ?? null,
          heightCm,
          activityLevel: user.profile.activityLevel ?? null,
          fitnessGoals: user.profile.fitnessGoals,
          weightKg,
          bodyFatPercentage: latest?.bodyFatPercentage ?? null,
          bmi,
          bmiCategory: bmi ? bmiCategory(bmi) : null,
          // Mifflin-St Jeor, computed server-side. Every day's targetCalories
          // must equal dailyCalorieTarget — do not estimate your own.
          bmr: energy.bmr,
          tdee: energy.tdee,
          dailyCalorieTarget: energy.targetCalories,
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

    const plan = await this.prisma.dietPlan.findUnique({
      where: { id: dietPlanId },
    });

    if (!plan) throw new Error(`Diet plan ${dietPlanId} no longer exists`);
    if (plan.status === 'superseded') {
      this.logger.log(`${tag}: already superseded, skipping`);
      return { dietPlanId, status: 'superseded' };
    }

    const settings = await this.prisma.appSettings.findFirst();
    const modelConfig = resolveModelConfig(
      PromptCategory.DietPlan,
      settings?.aiPrompts,
    );
    const model = this.resolveModel(modelConfig);

    if (!model) {
      throw new Error(
        'No LLM provider configured; cannot generate a diet plan',
      );
    }

    // Gemini-only (see `createWebSearchTool`) — `undefined` on OpenAI, so
    // this plan's meals simply get no citations rather than invented ones.
    const searchTool = this.resolveSearchTool(modelConfig);

    const prompt = resolvePrompt('diet_plan', settings?.aiPrompts);
    const usesAdminPrompt =
      settings?.aiPrompts?.some((p) => p.promptCategory === 'diet_plan') ??
      false;
    this.logger.log(
      `${tag}: resolved ${usesAdminPrompt ? 'admin-configured' : 'default'} prompt (${prompt.length} chars)`,
    );

    // Preferences are frozen on the plan row at request time (see
    // `DietPlansService.requestGeneration`) — read from there rather than
    // `job.data.preferences` so a retried job always reflects the latest
    // saved state, not whatever was queued on the first attempt.
    const preferencesBlock = formatDietPreferences(plan);
    const promptWithPreferences = `${prompt}\n\n${preferencesBlock}`;

    // generateObject takes no tools, so gather context first, then structure it.
    this.logger.log(`${tag}: gathering context via tools`);
    const research = generateText({
      model,
      prompt: `${promptWithPreferences}\n\nCall the tools to gather what you need, then outline the week in plain text.`,
      tools: { getUserDetails: this.userDetailsTool(userId) },
      stopWhen: stepCountIs(3),
      // This is tool-calling + a plain-text summary, not a hard reasoning
      // task — skip reasoning entirely so it can't eat its own output budget
      // on invisible reasoning tokens. Ignored by non-reasoning models.
      providerOptions: { openai: { reasoningEffort: 'low' } },
    });

    // Citations are mandatory for a diet plan — but Google's API gives no
    // way to actually FORCE Search grounding: `googleSearch` is a retrieval
    // tool the model decides to use on its own, and `toolChoice` has no
    // effect on it (confirmed in `@ai-sdk/google`'s `prepareTools`: a
    // request with only provider-defined tools drops `toolConfig`/
    // `toolChoice` entirely — it's silently ignored, not just weakly
    // applied). So the only real lever is prompting: ask concrete,
    // fact-seeking questions models are tuned to ground, retrying with a
    // more insistent prompt if the first attempt comes back with nothing.
    // Independent of `research`'s prompt, so it runs in parallel with it.
    const dietLine = plan.dietTypes
      .map((t) => DIET_TYPE_LABEL[t])
      .join(' and ');
    const searchBasePrompt = searchTool
      ? 'Look up current nutrition facts (calories, protein, fat and carbs ' +
        `per serving) for 3 dishes typical of a ${CUISINE_LABEL[plan.cuisine]} ` +
        `${dietLine} diet` +
        (plan.exclude.length > 0
          ? `, excluding: ${plan.exclude.join(', ')}`
          : '') +
        '. Use webSearch for each dish — search the web for the real ' +
        'figures, never answer from memory.'
      : '';

    const search = searchTool
      ? this.searchWithRetry(model, searchTool, searchBasePrompt, tag)
      : Promise.resolve<Citation[]>([]);

    const [researchResult, sources] = await Promise.all([research, search]);

    const toolCalls = researchResult.steps.flatMap((step) => step.toolCalls);
    this.logger.log(
      `${tag}: research complete — ${researchResult.steps.length} step(s), ` +
        `${toolCalls.map((c) => c.toolName).join(', ') || 'no tool calls'}, ` +
        `${researchResult.usage?.totalTokens ?? '?'} tokens`,
    );

    const toolContext = researchResult.steps
      .flatMap((step) => step.toolResults)
      .map((result) => `${result.toolName}: ${JSON.stringify(result.output)}`)
      .join('\n');

    const citationsInstructions =
      sources.length > 0
        ? [
            '',
            'Sources found during research (cite ONLY from this list, by exact url):',
            ...sources.map((s, i) => `${i + 1}. ${s.title} — ${s.url}`),
            '',
            'Mandatory: every meal must have a `citations` array with 1-3 of the ' +
              'entries above that back its nutrition figures or dish choice — ' +
              'copy title and url exactly. Pick the closest-matching source(s) ' +
              'even if the match is general (e.g. a cuisine/diet-type source for ' +
              'every meal of that cuisine/diet) rather than leaving a meal with ' +
              'no citation. Never invent a source or url not listed above.',
          ].join('\n')
        : '';

    const objectPrompt = [
      promptWithPreferences,
      '',
      'Data retrieved for this user:',
      toolContext || '(no tool data available)',
      '',
      researchResult.text,
      citationsInstructions,
    ].join('\n');

    const { object, usage } = await this.generateWeeklyDiet(
      model,
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

    const sourcesByUrl = new Map(sources.map((s) => [s.url, s]));

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

        // Never trust the model's own title/url — only that a claimed
        // citation's url exactly matches a real search result; the
        // canonical title always comes from the source pool itself.
        const citations: Citation[] = (meal.citations ?? [])
          .map((c) => sourcesByUrl.get(c.url))
          .filter((c): c is Citation => c !== undefined)
          .slice(0, 3);

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
          citations,
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

  /**
   * Runs `webSearch` and returns whatever real sources it grounded on,
   * retrying once with a more insistent prompt if the first attempt
   * produced nothing — see the long comment at the call site for why this
   * is the only lever available (no API-level way to force grounding).
   */
  private async searchWithRetry(
    model: LanguageModel,
    searchTool: NonNullable<ReturnType<AiSearchToolResolver>>,
    basePrompt: string,
    tag: string,
  ): Promise<Citation[]> {
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const run = await generateText({
        model,
        prompt:
          attempt === 1
            ? basePrompt
            : `${basePrompt} Important: you must actually call webSearch ` +
              'at least once before responding — do not answer without it.',
        tools: { webSearch: searchTool },
        stopWhen: stepCountIs(3),
        providerOptions: { openai: { reasoningEffort: 'low' } },
      });

      const sources = dedupeSources(run.steps.flatMap((step) => step.sources));
      this.logger.log(
        `${tag}: search attempt ${attempt}/${maxAttempts} — ${run.steps.length} step(s), ` +
          `${sources.length} source(s), ${run.usage?.totalTokens ?? '?'} tokens`,
      );
      if (sources.length > 0) return sources;
    }

    this.logger.warn(
      `${tag}: search returned no groundable sources after ${maxAttempts} ` +
        'attempts — meals will have no citations (Google Search grounding ' +
        'is model-discretion; there is no API-level way to force it)',
    );
    return [];
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
        providerOptions: { openai: { reasoningEffort: 'low' } },
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
        providerOptions: { openai: { reasoningEffort: 'low' } },
      });
    }
  }
}
