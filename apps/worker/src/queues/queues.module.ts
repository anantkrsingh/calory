import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import type { Env } from '@fitness/config/server';

import { ENV } from '../config/env.module';
import { OtpQueueProcessor } from './otp.processor';

/**
 * Registers the BullMQ connection and job processors this worker runs.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (env: Env) => ({
        redis: {
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          password: env.REDIS_PASSWORD,
          maxRetriesPerRequest: null,
          enableOfflineQueue: false,
        },
        prefix: 'fitness',
      }),
      inject: [ENV],
    }),
  ],
  providers: [OtpQueueProcessor],
})
export class QueuesModule {}
