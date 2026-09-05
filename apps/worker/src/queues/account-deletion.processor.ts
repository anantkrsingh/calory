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

/** Thrown to abort a single account's delete transaction when a re-check
 * finds the deletion was cancelled (user logged back in) after the sweep's
 * initial scan — never a real failure, so it's handled separately from
 * `catch`'s error-logging branch. */
class CancelledDeletionError extends Error {}

@Injectable()
export class AccountDeletionProcessor implements OnModuleInit, OnModuleDestroy {
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

    this.worker = new Worker<Record<string, never>, AccountDeletionSweepResult>(
      ACCOUNT_DELETION_QUEUE_NAME,
      () => this.sweepExpiredAccounts(),
      {
        connection,
        prefix: 'fitness',
      },
    );

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
   * Hard-deletes every account whose grace period has elapsed — the only
   * place a user's data is actually removed; `UsersService.requestDeletion`
   * only schedules it.
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
    let cancelled = 0;
    for (const { id } of expired) {
      try {
        // RoutineDay/RoutineDayExercise are normalized out of WorkoutRoutine
        // (own collections, no cascade relied on — see routine.processor.ts)
        // so they need their own deletes, scoped via a pre-fetch since
        // `$transaction`'s array form can't chain one op's result into
        // another.
        const routineIds = (
          await this.prisma.workoutRoutine.findMany({
            where: { userId: id },
            select: { id: true },
          })
        ).map((routine) => routine.id);
        const dayIds = routineIds.length
          ? (
              await this.prisma.routineDay.findMany({
                where: { routineId: { in: routineIds } },
                select: { id: true },
              })
            ).map((day) => day.id)
          : [];

        // Interactive transaction: the `findMany` above ran once for the whole
        // batch, and this account may have logged back in (which clears
        // `deletionRequestedAt` — see `AuthService.login`/`loginSocial`) any
        // time between that query and this account's turn in the loop, which
        // for a full batch of `SWEEP_BATCH_SIZE` can be a while. Re-checking
        // here, inside the same transaction as the deletes, closes that
        // window instead of blindly deleting whatever the initial scan saw.
        await this.prisma.$transaction(async (tx) => {
          const current = await tx.user.findUnique({
            where: { id },
            select: { deletionRequestedAt: true },
          });
          if (
            !current?.deletionRequestedAt ||
            current.deletionRequestedAt > cutoff
          ) {
            throw new CancelledDeletionError();
          }

          await tx.routineDayExercise.deleteMany({
            where: { dayId: { in: dayIds } },
          });
          await tx.routineDay.deleteMany({
            where: { routineId: { in: routineIds } },
          });
          await tx.workout.deleteMany({ where: { userId: id } });
          await tx.routine.deleteMany({ where: { userId: id } });
          await tx.bodyMeasurement.deleteMany({ where: { userId: id } });
          await tx.goal.deleteMany({ where: { userId: id } });
          await tx.exercise.deleteMany({ where: { createdById: id } });
          await tx.workoutRoutine.deleteMany({ where: { userId: id } });
          await tx.chatConversation.deleteMany({ where: { userId: id } });
          await tx.dailySteps.deleteMany({ where: { userId: id } });
          await tx.user.delete({ where: { id } });
        });
        deleted += 1;
      } catch (error) {
        if (error instanceof CancelledDeletionError) {
          cancelled += 1;
          continue;
        }
        this.logger.error(
          `Could not delete account ${id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (cancelled > 0) {
      this.logger.log(
        `Account deletion sweep: skipped ${cancelled} account(s) cancelled since the sweep started`,
      );
    }

    if (deleted > 0) {
      this.logger.log(`Account deletion sweep: removed ${deleted} account(s)`);
    }

    return { deleted };
  }
}
