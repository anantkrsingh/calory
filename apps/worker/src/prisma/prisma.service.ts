import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@fitness/db';

import { ENV, type Env } from '../config/env.module';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(@Inject(ENV) env: Env) {
    super({
      datasources: { db: { url: env.MONGODB_URI } },
      log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      // Mongo has no multi-document joins, so an interactive `$transaction`
      // whose nested creates span several collections (see
      // DietPlanProcessor.replaceDays, RoutineProcessor.replaceDays) turns
      // into one round trip per document — a full week's worth of days,
      // meals and items can add up to well over Prisma's 5s default
      // `timeout`, which surfaces as "Transaction already closed: A query
      // cannot be executed on an expired transaction." Widened for every
      // transaction on this client rather than per call site.
      transactionOptions: { maxWait: 10_000, timeout: 30_000 },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to MongoDB');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
