import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { quoteOfTheDaySchema, resolvePrompt } from '@fitness/ai';
import type { Env } from '@fitness/config/server';
import {
  QUOTE_QUEUE_NAME,
  type QuoteJobData,
  type QuoteJobResult,
} from '@fitness/types';
import { generateObject, type LanguageModel } from 'ai';
import { Queue, Worker, type Job } from 'bullmq';

import { AI_MODEL } from '../ai/ai.module';
import { ENV } from '../config/env.module';
import { PrismaService } from '../prisma/prisma.service';

const REPEAT_JOB_KEY = 'daily-quote';

/** UTC calendar date, matching what the API reads back. */
const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

@Injectable()
export class QuoteProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QuoteProcessor.name);
  private worker?: Worker<QuoteJobData, QuoteJobResult>;
  private queue?: Queue<QuoteJobData>;

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

    this.queue = new Queue<QuoteJobData>(QUOTE_QUEUE_NAME, {
      connection,
      prefix: 'fitness',
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'exponential', delay: 30_000 },
      },
    });

    this.worker = new Worker<QuoteJobData, QuoteJobResult>(
      QUOTE_QUEUE_NAME,
      (job) => this.handle(job),
      { connection, prefix: 'fitness' },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Quote job ${job?.id} failed: ${error.message}`);
    });

    await this.scheduleDaily();
    await this.ensureTodaysQuote();
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }

  /** Idempotent: re-running replaces the existing repeat schedule. */
  private async scheduleDaily(): Promise<void> {
    try {
      await this.queue?.upsertJobScheduler(
        REPEAT_JOB_KEY,
        { pattern: this.env.QUOTE_CRON, tz: this.env.QUOTE_TIMEZONE },
        { name: 'generateQuote', data: { date: '' } },
      );
      this.logger.log(
        `Daily quote scheduled: ${this.env.QUOTE_CRON} (${this.env.QUOTE_TIMEZONE})`,
      );
    } catch (error) {
      this.logger.error(
        `Could not schedule the daily quote: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** Backfills on boot so a fresh deploy has a quote before the first cron tick. */
  private async ensureTodaysQuote(): Promise<void> {
    try {
      const date = isoDate(new Date());
      const existing = await this.prisma.dailyQuote.findUnique({
        where: { date },
      });
      if (existing) return;

      await this.queue?.add('generateQuote', { date });
    } catch (error) {
      this.logger.error(
        `Could not backfill today's quote: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async handle(job: Job<QuoteJobData>): Promise<QuoteJobResult> {
    // Scheduled jobs carry no date; use the day the job actually runs.
    const date = job.data.date || isoDate(new Date());

    const existing = await this.prisma.dailyQuote.findUnique({
      where: { date },
    });

    if (existing) {
      this.logger.log(`Quote for ${date} already exists, skipping`);
      return { date, quoteOfTheDay: existing.quoteOfTheDay };
    }

    if (!this.model) {
      throw new Error('No LLM provider configured; cannot generate a quote');
    }

    const settings = await this.prisma.appSettings.findFirst();
    const prompt = resolvePrompt('quote_of_the_day', settings?.aiPrompts);

    const { object } = await generateObject({
      model: this.model,
      schema: quoteOfTheDaySchema,
      prompt,
    });

    const quote = await this.prisma.dailyQuote.upsert({
      where: { date },
      create: { date, quoteOfTheDay: object.quoteOfTheDay },
      update: { quoteOfTheDay: object.quoteOfTheDay },
    });

    this.logger.log(`Generated quote for ${date}`);

    return { date, quoteOfTheDay: quote.quoteOfTheDay };
  }
}
