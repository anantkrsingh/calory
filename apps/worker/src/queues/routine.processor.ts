import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { resolvePrompt, weeklyRoutineSchema } from '@fitness/ai';
import type { WeeklyRoutine } from '@fitness/ai';
import {
  ROUTINE_QUEUE_NAME,
  ROUTINE_RECONCILE_QUEUE_NAME,
  type DayOfWeek,
  type RoutineDayStatus,
  type RoutineJobData,
  type RoutineJobResult,
  type RoutineReconcileJobResult,
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
import { Queue, Worker, type Job } from 'bullmq';
import { z } from 'zod';

import { AI_MODEL } from '../ai/ai.module';
import { ENV, type Env } from '../config/env.module';
import { PrismaService } from '../prisma/prisma.service';

const MAX_EXERCISES = 60;
const RECONCILE_REPEAT_KEY = 'routine-reconcile';
// Cap per reconciliation pass so one tick can't flood the LLM queue; the next
// scheduled run picks up whatever is left.
const RECONCILE_BATCH_SIZE = 200;
// A full 7-day plan is a large structured object; too low a cap here reads
// as a schema-validation failure (truncated JSON), not a token-limit one.
const ROUTINE_OBJECT_MAX_OUTPUT_TOKENS = 16000;
// Give the repair attempt even more headroom — a truncated first attempt
// means the budget above wasn't enough.
const ROUTINE_OBJECT_REPAIR_MAX_OUTPUT_TOKENS = 24000;

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

// Models routinely send 0 for reps/durationSec when the field just doesn't
// apply to that exercise, instead of omitting it — 0 of either is never a
// real prescription, so treat it the same as null/undefined.
const positiveOrNull = (value: number | null | undefined): number | null =>
  value ? value : null;

@Injectable()
export class RoutineProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RoutineProcessor.name);
  private worker?: Worker<RoutineJobData, RoutineJobResult>;
  // Producer side of the generate queue, needed so reconciliation can enqueue
  // jobs for backfilled users the same way the API does on registration.
  private generateQueue?: Queue<RoutineJobData, RoutineJobResult>;
  private reconcileQueue?: Queue<
    Record<string, never>,
    RoutineReconcileJobResult
  >;
  private reconcileWorker?: Worker<
    Record<string, never>,
    RoutineReconcileJobResult
  >;

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(AI_MODEL) private readonly model: LanguageModel | null,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    const connection = {
      host: this.env.REDIS_HOST,
      port: this.env.REDIS_PORT,
      password: this.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    };

    this.worker = new Worker<RoutineJobData, RoutineJobResult>(
      ROUTINE_QUEUE_NAME,
      (job) => this.handle(job),
      { connection, prefix: 'fitness' },
    );

    this.worker.on('failed', (job, error) => {
      const maxAttempts = job?.opts.attempts ?? 1;
      this.logger.error(
        `Routine job ${job?.id} (routine ${job?.data.routineId}, user ${job?.data.userId}) ` +
          `failed on attempt ${job?.attemptsMade}/${maxAttempts}: ${error.message}`,
        error.stack,
      );

      // Only give up once BullMQ has exhausted its retries.
      const exhausted = !job || job.attemptsMade >= maxAttempts;
      if (exhausted) void this.markFailed(job?.data.routineId, error.message);
    });

    this.generateQueue = new Queue<RoutineJobData, RoutineJobResult>(
      ROUTINE_QUEUE_NAME,
      { connection, prefix: 'fitness' },
    );

    this.reconcileQueue = new Queue<
      Record<string, never>,
      RoutineReconcileJobResult
    >(ROUTINE_RECONCILE_QUEUE_NAME, {
      connection,
      prefix: 'fitness',
      defaultJobOptions: { removeOnComplete: 10, removeOnFail: 20 },
    });

    this.reconcileWorker = new Worker<
      Record<string, never>,
      RoutineReconcileJobResult
    >(ROUTINE_RECONCILE_QUEUE_NAME, () => this.reconcileMissingRoutines(), {
      connection,
      prefix: 'fitness',
    });

    this.reconcileWorker.on('failed', (job, error) => {
      this.logger.error(
        `Routine reconcile job ${job?.id} failed: ${error.message}`,
      );
    });

    await this.scheduleReconciliation();
    // Also run once on boot so a fresh deploy doesn't wait for the first tick.
    await this.reconcileQueue.add('reconcile', {});
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.generateQueue?.close();
    await this.reconcileWorker?.close();
    await this.reconcileQueue?.close();
  }

  /** Idempotent: re-running replaces the existing repeat schedule. */
  private async scheduleReconciliation(): Promise<void> {
    try {
      await this.reconcileQueue?.upsertJobScheduler(
        RECONCILE_REPEAT_KEY,
        { pattern: this.env.ROUTINE_RECONCILE_CRON },
        { name: 'reconcile', data: {} },
      );
      this.logger.log(
        `Routine reconciliation scheduled: ${this.env.ROUTINE_RECONCILE_CRON}`,
      );
    } catch (error) {
      this.logger.error(
        `Could not schedule routine reconciliation: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** Backfill: any user with no `generating`/`active` routine gets a fresh
   * generation job, same as `WorkoutRoutineService.requestGeneration` on
   * registration. A retried failure has its old `failed` row(s) superseded. */
  private async reconcileMissingRoutines(): Promise<RoutineReconcileJobResult> {
    const inProgressOrActive = await this.prisma.workoutRoutine.findMany({
      where: { status: { in: ['generating', 'active'] } },
      select: { userId: true },
      distinct: ['userId'],
    });

    const covered = inProgressOrActive.map((row) => row.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { notIn: covered } },
      select: { id: true },
      take: RECONCILE_BATCH_SIZE,
    });

    const priorFailures = await this.prisma.workoutRoutine.findMany({
      where: { userId: { in: users.map((u) => u.id) }, status: 'failed' },
      select: { id: true, userId: true },
    });
    const failedRoutineIdsByUser = new Map<string, string[]>();
    for (const row of priorFailures) {
      const ids = failedRoutineIdsByUser.get(row.userId) ?? [];
      ids.push(row.id);
      failedRoutineIdsByUser.set(row.userId, ids);
    }

    let queued = 0;
    let retriedAfterFailure = 0;
    let neverGenerated = 0;

    for (const user of users) {
      const priorFailedIds = failedRoutineIdsByUser.get(user.id) ?? [];

      try {
        const routine = await this.prisma.workoutRoutine.create({
          data: { userId: user.id, status: 'generating' },
        });

        const job = await this.generateQueue?.add(
          'generateRoutine',
          { userId: user.id, routineId: routine.id },
          {
            jobId: `routine-${routine.id}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 20_000 },
          },
        );

        if (job) {
          queued += 1;
          if (priorFailedIds.length > 0) {
            retriedAfterFailure += 1;
            await this.prisma.workoutRoutine.updateMany({
              where: { id: { in: priorFailedIds } },
              data: { status: 'superseded' },
            });
          } else {
            neverGenerated += 1;
          }
        } else {
          await this.prisma.workoutRoutine.update({
            where: { id: routine.id },
            data: { status: 'failed', error: 'Could not queue generation job' },
          });
        }
      } catch (error) {
        this.logger.error(
          `Could not backfill a routine for user ${user.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    this.logger.log(
      `Routine reconciliation: queued ${queued} of ${users.length} users needing ` +
        `a plan (${neverGenerated} never generated, ${retriedAfterFailure} retried after failure)`,
    );

    return { queued, neverGenerated, retriedAfterFailure };
  }

  private async markFailed(
    routineId: string | undefined,
    error: string,
  ): Promise<void> {
    if (!routineId) return;
    try {
      // updateMany so a superseded or already-active routine is left alone.
      await this.prisma.workoutRoutine.updateMany({
        where: { id: routineId, status: 'generating' },
        data: { status: 'failed', error: error.slice(0, 500) },
      });
    } catch (cause) {
      this.logger.error(
        `Could not mark routine ${routineId} failed: ${
          cause instanceof Error ? cause.message : String(cause)
        }`,
      );
    }
  }

  private userDetailsTool(userId: string) {
    return tool({
      description:
        'Get the profile of the user this routine is for: age, sex, height, ' +
        'weight, BMI, activity level, chosen fitness goals and weekly workout target.',
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
        // Computed here, not left to the model — it drives the calorie targets.
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
          // The goals the user picked at signup — use these to steer the
          // calorie (intake/burn) and step targets, e.g. a deficit + higher
          // step target for lose_weight, a surplus for build_muscle.
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

  private listExercisesTool(userId: string) {
    return tool({
      description:
        'List exercises available to this user. Returns the shared catalogue ' +
        'plus their custom exercises. Use only these exerciseId values.',
      inputSchema: z.object({
        muscleGroup: z.string().optional(),
        equipment: z.string().optional(),
      }),
      execute: async ({ muscleGroup, equipment }) => {
        const rows = await this.prisma.exercise.findMany({
          where: {
            OR: [{ createdById: null }, { createdById: userId }],
            ...(muscleGroup
              ? { primaryMuscles: { has: muscleGroup as never } }
              : {}),
            ...(equipment ? { equipment: equipment as never } : {}),
          },
          take: MAX_EXERCISES,
          select: {
            id: true,
            name: true,
            category: true,
            primaryMuscles: true,
            equipment: true,
          },
        });

        return rows.map((row) => ({
          exerciseId: row.id,
          name: row.name,
          category: row.category,
          primaryMuscles: row.primaryMuscles,
          equipment: row.equipment,
        }));
      },
    });
  }

  private async handle(job: Job<RoutineJobData>): Promise<RoutineJobResult> {
    const { userId, routineId } = job.data;
    const startedAt = Date.now();
    const tag = `Routine ${routineId} (user ${userId}, job ${job.id}, attempt ${job.attemptsMade + 1})`;

    this.logger.log(`${tag}: starting generation`);

    if (!this.model) {
      throw new Error('No LLM provider configured; cannot generate a routine');
    }

    const routine = await this.prisma.workoutRoutine.findUnique({
      where: { id: routineId },
    });

    if (!routine) throw new Error(`Routine ${routineId} no longer exists`);
    if (routine.status === 'superseded') {
      this.logger.log(`${tag}: already superseded, skipping`);
      return { routineId, status: 'superseded' };
    }

    const settings = await this.prisma.appSettings.findFirst();
    const prompt = resolvePrompt('workout_routine', settings?.aiPrompts);
    const usesAdminPrompt =
      settings?.aiPrompts?.some(
        (p) => p.promptCategory === 'workout_routine',
      ) ?? false;
    this.logger.log(
      `${tag}: resolved ${usesAdminPrompt ? 'admin-configured' : 'default'} prompt (${prompt.length} chars)`,
    );

    // generateObject takes no tools, so gather context first, then structure it.
    this.logger.log(`${tag}: gathering context via tools`);
    const research = await generateText({
      model: this.model,
      prompt: `${prompt}\n\nCall the tools to gather what you need, then outline the week in plain text.`,
      tools: {
        getUserDetails: this.userDetailsTool(userId),
        listExercises: this.listExercisesTool(userId),
      },
      stopWhen: stepCountIs(6),
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

    const { object, usage } = await this.generateWeeklyRoutine(
      this.model,
      objectPrompt,
      tag,
    );

    const totalExercises = object.days.reduce(
      (sum, d) => sum + d.exercises.length,
      0,
    );
    this.logger.log(
      `${tag}: plan generated — ${object.days.length} day(s), ${totalExercises} exercise slot(s), ` +
        `dailyCalorieTarget=${object.dailyCalorieTarget}, ${usage?.totalTokens ?? '?'} tokens`,
    );

    const exerciseNames = await this.validExerciseNames(userId, object);

    const days = object.days.map((day, dayIndex) => {
      // Drop rest-day placeholders and hallucinated ids alike — anything
      // without a real, visible exerciseId can't be persisted.
      const exercises = day.exercises
        .filter(
          (exercise): exercise is typeof exercise & { exerciseId: string } =>
            !!exercise.exerciseId && exerciseNames.has(exercise.exerciseId),
        )
        .map((exercise) => ({
          exercise,
          name: exerciseNames.get(exercise.exerciseId)!,
        }));
      const dropped = day.exercises.length - exercises.length;
      if (dropped > 0) {
        this.logger.warn(
          `${tag}: dropped ${dropped} exercise(s) with a missing/unrecognized id on day ${day.dayOfWeek}`,
        );
      }

      return {
        order: dayIndex,
        dayOfWeek: day.dayOfWeek,
        status: day.status,
        targetCaloriesBurned: day.targetCaloriesBurned,
        caloriesFromRunning: day.caloriesFromRunning,
        caloriesFromExercises: day.caloriesFromExercises,
        stepsTarget: day.stepsTarget,
        runningDistanceKm: day.runningDistanceKm ?? null,
        runningDurationMin: day.runningDurationMin ?? null,
        focus: day.focus,
        exercises: exercises.map(({ exercise, name }, exerciseIndex) => ({
          order: exerciseIndex,
          exerciseId: exercise.exerciseId,
          // The catalog's name, never the model's — see validExerciseNames.
          exerciseName: name,
          // Duration-based cardio has no real "sets" — 1 continuous effort.
          sets: exercise.sets || 1,
          reps: positiveOrNull(exercise.reps),
          durationSec: positiveOrNull(exercise.durationSec),
          restSeconds: exercise.restSeconds ?? null,
          estimatedCalories: exercise.estimatedCalories ?? null,
        })),
      };
    });

    // Claim the routine first — guards against a concurrent supersede, same
    // as before normalization. Only once that succeeds do we touch
    // RoutineDay/RoutineDayExercise, so a lost race never leaves half-written
    // days behind.
    const { count } = await this.prisma.workoutRoutine.updateMany({
      where: { id: routineId, status: 'generating' },
      data: {
        status: 'active',
        dailyCalorieTarget: object.dailyCalorieTarget,
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
      return { routineId, status: 'superseded' };
    }

    await this.replaceDays(routineId, days);

    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
    this.logger.log(`${tag}: generated and saved in ${elapsedSec}s`);

    return { routineId, status: 'active' };
  }

  /**
   * Replaces every RoutineDay (and RoutineDayExercise) for a routine with a
   * freshly generated week — a regenerate is a full rewrite conceptually, so
   * delete-then-recreate is simpler and safer than diffing the old plan.
   * Deletes explicitly rather than relying on `onDelete: Cascade` alone —
   * same explicit-over-emulated convention as the account-deletion sweep.
   */
  private async replaceDays(
    routineId: string,
    days: {
      order: number;
      dayOfWeek: DayOfWeek;
      status: RoutineDayStatus;
      targetCaloriesBurned: number;
      caloriesFromRunning?: number | null;
      caloriesFromExercises?: number | null;
      stepsTarget?: number | null;
      runningDistanceKm: number | null;
      runningDurationMin: number | null;
      focus: string;
      exercises: {
        order: number;
        exerciseId: string;
        exerciseName: string;
        sets: number;
        reps: number | null;
        durationSec: number | null;
        restSeconds: number | null;
        estimatedCalories: number | null;
      }[];
    }[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existingDayIds = (
        await tx.routineDay.findMany({
          where: { routineId },
          select: { id: true },
        })
      ).map((d) => d.id);

      if (existingDayIds.length > 0) {
        await tx.routineDayExercise.deleteMany({
          where: { dayId: { in: existingDayIds } },
        });
        await tx.routineDay.deleteMany({ where: { routineId } });
      }

      for (const { exercises, ...day } of days) {
        await tx.routineDay.create({
          data: { ...day, routineId, exercises: { create: exercises } },
        });
      }
    });
  }

  private async generateWeeklyRoutine(
    model: LanguageModel,
    prompt: string,
    tag: string,
  ): Promise<{ object: WeeklyRoutine; usage: LanguageModelUsage | undefined }> {
    try {
      return await generateObject({
        model,
        schema: weeklyRoutineSchema,
        prompt,
        maxOutputTokens: ROUTINE_OBJECT_MAX_OUTPUT_TOKENS,
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
        schema: weeklyRoutineSchema,
        prompt: truncated
          ? [
              prompt,
              '',
              'Your previous response was cut off before it finished (ran out ' +
                'of output budget). Produce the same response again, but keep ' +
                'focus and summary text terse so the full JSON fits.',
            ].join('\n')
          : [
              prompt,
              '',
              'Your previous response did not satisfy the required schema:',
              causeMessage ?? 'unknown validation error',
              '',
              'Produce a corrected response that satisfies every field exactly.',
            ].join('\n'),
        maxOutputTokens: ROUTINE_OBJECT_REPAIR_MAX_OUTPUT_TOKENS,
        providerOptions: { openai: { reasoningEffort: 'minimal' } },
      });
    }
  }

  /** Exercise ids the model referenced that actually exist and belong to this user. */
  /** id → canonical name for every referenced id that actually exists and is
   * visible to this user. The model's own exerciseName is never trusted for
   * display — a placeholder/rest-day entry can carry a null id and name
   * together, and a real id's name is looked up here instead of copied. */
  private async validExerciseNames(
    userId: string,
    object: { days: { exercises: { exerciseId?: string | null }[] }[] },
  ): Promise<Map<string, string>> {
    const referenced = [
      ...new Set(
        object.days.flatMap((day) =>
          day.exercises
            .map((exercise) => exercise.exerciseId)
            .filter((id): id is string => !!id),
        ),
      ),
    ].filter((id) => /^[0-9a-fA-F]{24}$/.test(id));

    if (referenced.length === 0) return new Map();

    const rows = await this.prisma.exercise.findMany({
      where: {
        id: { in: referenced },
        OR: [{ createdById: null }, { createdById: userId }],
      },
      select: { id: true, name: true },
    });

    return new Map(rows.map((row) => [row.id, row.name]));
  }
}
