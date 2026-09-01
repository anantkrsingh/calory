import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import {
  ACCOUNT_DELETION_QUEUE_NAME,
  type AccountDeletionSweepResult,
} from '@fitness/types';
import { Queue, Worker } from 'bullmq';

import { ENV, type Env } from '../config/env.module';
import { PrismaService } from '../prisma/prisma.service';

const SWEEP_REPEAT_KEY = 'account-deletion-sweep';
// Kept in sync by hand with `ACCOUNT_DELETION_GRACE_DAYS` in
// `apps/api/src/users/users.service.ts` — that's where the grace period is
// enforced on the read side (login cancels it); this is where it's enforced
// on the write side (the account actually goes away).
const ACCOUNT_DELETION_GRACE_DAYS = 30;
// Cap per sweep so one tick can't turn into a huge transaction; whatever is
// left over is picked up by the next scheduled run.
const SWEEP_BATCH_SIZE = 200;

@Injectable()
export class AccountDeletionProcessor
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AccountDeletionProcessor.name);
  private queue?: Queue<Record<string, never>, AccountDeletionSweepResult>;
  private worker?: Worker<Record<string, never>, AccountDeletionSweepResult>;

  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    const connection = {
      host: this.env.REDIS_HOST,
      port: this.env.REDIS_PORT,
      password: this.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    };

    this.queue = new Queue<Record<string, never>, AccountDeletionSweepResult>(
      ACCOUNT_DELETION_QUEUE_NAME,
      {
        connection,
        prefix: 'fitness',
        defaultJobOptions: { removeOnComplete: 10, removeOnFail: 20 },
      },
    );

    this.worker = new Worker<
      Record<string, never>,
      AccountDeletionSweepResult
    >(ACCOUNT_DELETION_QUEUE_NAME, () => this.sweepExpiredAccounts(), {
      connection,
      prefix: 'fitness',
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Account deletion sweep ${job?.id} failed: ${error.message}`,
      );
    });

    await this.scheduleSweep();
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }

  /** Idempotent: re-running replaces the existing repeat schedule. */
  private async scheduleSweep(): Promise<void> {
    try {
      await this.queue?.upsertJobScheduler(
        SWEEP_REPEAT_KEY,
        { pattern: this.env.ACCOUNT_DELETION_CRON },
        { name: 'sweep', data: {} },
      );
      this.logger.log(
        `Account deletion sweep scheduled: ${this.env.ACCOUNT_DELETION_CRON}`,
      );
    } catch (error) {
      this.logger.error(
        `Could not schedule the account deletion sweep: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Hard-deletes every account whose grace period has elapsed. Mirrors
   * `UsersService.remove`'s deletion transaction — the two run in separate
   * processes and can't share code, so keep them in sync by hand.
   */
  private async sweepExpiredAccounts(): Promise<AccountDeletionSweepResult> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ACCOUNT_DELETION_GRACE_DAYS);

    const expired = await this.prisma.user.findMany({
      where: { deletionRequestedAt: { lte: cutoff } },
      select: { id: true },
      take: SWEEP_BATCH_SIZE,
    });

    let deleted = 0;
    for (const { id } of expired) {
      try {
        await this.prisma.$transaction([
          this.prisma.workout.deleteMany({ where: { userId: id } }),
          this.prisma.routine.deleteMany({ where: { userId: id } }),
          this.prisma.bodyMeasurement.deleteMany({ where: { userId: id } }),
          this.prisma.goal.deleteMany({ where: { userId: id } }),
          this.prisma.exercise.deleteMany({ where: { createdById: id } }),
          this.prisma.workoutRoutine.deleteMany({ where: { userId: id } }),
          this.prisma.chatConversation.deleteMany({ where: { userId: id } }),
          this.prisma.dailySteps.deleteMany({ where: { userId: id } }),
          this.prisma.user.delete({ where: { id } }),
        ]);
        deleted += 1;
      } catch (error) {
        this.logger.error(
          `Could not delete account ${id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (deleted > 0) {
      this.logger.log(`Account deletion sweep: removed ${deleted} account(s)`);
    }

    return { deleted };
  }
}
