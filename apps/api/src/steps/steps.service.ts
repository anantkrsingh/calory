import { Injectable } from '@nestjs/common';
import { DEFAULT_DAILY_STEPS_GOAL } from '@fitness/config';
import { toDailySteps } from '@fitness/db';
import type { DailySteps, Id, IsoDate, StepsSummary } from '@fitness/types';
import type {
  StepsRangeQueryInput,
  UpsertStepsInput,
} from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StepsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Idempotent — the client re-sends the day's running total as the pedometer climbs. */
  async upsert(
    userId: Id,
    date: IsoDate,
    input: UpsertStepsInput,
  ): Promise<DailySteps> {
    const row = await this.prisma.dailySteps.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, steps: input.steps },
      update: { steps: input.steps },
    });

    return toDailySteps(row);
  }

  /** One day's total, or zero if nothing has been recorded yet. */
  async get(userId: Id, date: IsoDate): Promise<StepsSummary> {
    const row = await this.prisma.dailySteps.findUnique({
      where: { userId_date: { userId, date } },
    });

    return {
      date,
      steps: row?.steps ?? 0,
      goal: DEFAULT_DAILY_STEPS_GOAL,
    };
  }

  async range(userId: Id, query: StepsRangeQueryInput): Promise<DailySteps[]> {
    const rows = await this.prisma.dailySteps.findMany({
      where: { userId, date: { gte: query.from, lte: query.to } },
      orderBy: { date: 'asc' },
    });

    return rows.map(toDailySteps);
  }
}
