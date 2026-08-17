import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { resolvePrompt, weeklyRoutineSchema } from '@fitness/ai';
import type { Env } from '@fitness/config/server';
import {
  ROUTINE_QUEUE_NAME,
  type RoutineJobData,
  type RoutineJobResult,
} from '@fitness/types';
import {
  generateObject,
  generateText,
  stepCountIs,
  tool,
  type LanguageModel,
} from 'ai';
import { Worker, type Job } from 'bullmq';
import { z } from 'zod';

import { AI_MODEL } from '../ai/ai.module';
import { ENV } from '../config/env.module';
import { PrismaService } from '../prisma/prisma.service';

const MAX_EXERCISES = 60;

const yearsSince = (isoDate: string): number | null => {
  const born = new Date(isoDate);
  if (Number.isNaN(born.getTime())) return null;
  const ms = Date.now() - born.getTime();
  return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
};

@Injectable()
export class RoutineProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RoutineProcessor.name);
  private worker?: Worker<RoutineJobData, RoutineJobResult>;

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(AI_MODEL) private readonly model: LanguageModel | null,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker<RoutineJobData, RoutineJobResult>(
      ROUTINE_QUEUE_NAME,
      (job) => this.handle(job),
      {
        connection: {
          host: this.env.REDIS_HOST,
          port: this.env.REDIS_PORT,
          password: this.env.REDIS_PASSWORD,
          maxRetriesPerRequest: null,
        },
        prefix: 'fitness',
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Routine job ${job?.id} failed: ${error.message}`);

      // Only give up once BullMQ has exhausted its retries.
      const exhausted =
        !job || job.attemptsMade >= (job.opts.attempts ?? 1);
      if (exhausted) void this.markFailed(job?.data.routineId, error.message);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
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
        'weight, activity level and weekly workout target.',
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

        return {
          displayName: user.profile.displayName,
          ageYears: user.profile.dateOfBirth
            ? yearsSince(user.profile.dateOfBirth)
            : null,
          sex: user.profile.sex ?? null,
          heightCm: user.profile.heightCm ?? null,
          activityLevel: user.profile.activityLevel ?? null,
          weightKg: latest?.weightKg ?? null,
          bodyFatPercentage: latest?.bodyFatPercentage ?? null,
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

    if (!this.model) {
      throw new Error('No LLM provider configured; cannot generate a routine');
    }

    const routine = await this.prisma.workoutRoutine.findUnique({
      where: { id: routineId },
    });

    if (!routine) throw new Error(`Routine ${routineId} no longer exists`);
    if (routine.status === 'superseded') {
      this.logger.log(`Routine ${routineId} was superseded, skipping`);
      return { routineId, status: 'superseded' };
    }

    const settings = await this.prisma.appSettings.findFirst();
    const prompt = resolvePrompt('workout_routine', settings?.aiPrompts);

    // generateObject takes no tools, so gather context first, then structure it.
    const research = await generateText({
      model: this.model,
      prompt: `${prompt}\n\nCall the tools to gather what you need, then outline the week in plain text.`,
      tools: {
        getUserDetails: this.userDetailsTool(userId),
        listExercises: this.listExercisesTool(userId),
      },
      stopWhen: stepCountIs(6),
    });

    const toolContext = research.steps
      .flatMap((step) => step.toolResults)
      .map((result) => `${result.toolName}: ${JSON.stringify(result.output)}`)
      .join('\n');

    const { object } = await generateObject({
      model: this.model,
      schema: weeklyRoutineSchema,
      prompt: [
        prompt,
        '',
        'Data retrieved for this user:',
        toolContext || '(no tool data available)',
        '',
        research.text,
      ].join('\n'),
    });

    const validIds = await this.validExerciseIds(userId, object);

    const days = object.days.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      isRestDay: day.isRestDay,
      targetCaloriesBurned: day.targetCaloriesBurned,
      focus: day.focus,
      // Drop hallucinated ids rather than persisting a broken reference.
      exercises: day.exercises
        .filter((exercise) => validIds.has(exercise.exerciseId))
        .map((exercise) => ({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          sets: exercise.sets,
          reps: exercise.reps ?? null,
          durationSec: exercise.durationSec ?? null,
          restSeconds: exercise.restSeconds ?? null,
        })),
    }));

    // A regenerate request may have superseded this routine while the model ran.
    const { count } = await this.prisma.workoutRoutine.updateMany({
      where: { id: routineId, status: 'generating' },
      data: {
        status: 'active',
        dailyCalorieTarget: object.dailyCalorieTarget,
        summary: object.summary,
        days,
        error: null,
        generatedAt: new Date(),
      },
    });

    if (count === 0) {
      this.logger.log(`Routine ${routineId} was superseded mid-generation`);
      return { routineId, status: 'superseded' };
    }

    this.logger.log(`Routine ${routineId} generated for user ${userId}`);

    return { routineId, status: 'active' };
  }

  /** Exercise ids the model referenced that actually exist and belong to this user. */
  private async validExerciseIds(
    userId: string,
    object: { days: { exercises: { exerciseId: string }[] }[] },
  ): Promise<Set<string>> {
    const referenced = [
      ...new Set(
        object.days.flatMap((day) =>
          day.exercises.map((exercise) => exercise.exerciseId),
        ),
      ),
    ].filter((id) => /^[0-9a-fA-F]{24}$/.test(id));

    if (referenced.length === 0) return new Set();

    const rows = await this.prisma.exercise.findMany({
      where: {
        id: { in: referenced },
        OR: [{ createdById: null }, { createdById: userId }],
      },
      select: { id: true },
    });

    return new Set(rows.map((row) => row.id));
  }
}
