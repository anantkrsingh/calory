import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { Queue } from 'bullmq';
import type { Env } from '@fitness/config/server';

import { ENV } from '../config/env.module';
import { BULL_QUEUE_PROVIDER, QueueProvider } from './queues.constants';
import { OtpController } from './otp.controller';
import { OtpQueue } from './otp.queue';
import { OtpQueueProcessor } from './otp.processor';
import { OtpService } from './otp.service';

const queueProvider: QueueProvider = (name: string) => {
  return new Queue(name, {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    },
    prefix: 'fitness',
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  });
};

/**
 * Global BullMQ module that provides queue connections and job processors.
 * Import this module in any module that needs to add jobs to queues.
 */
@Global()
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
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
      inject: [ENV],
    }),
  ],
  providers: [
    {
      provide: BULL_QUEUE_PROVIDER,
      useValue: queueProvider,
    },
    OtpQueue,
    OtpQueueProcessor,
    OtpService,
  ],
  controllers: [OtpController],
  exports: [BullModule, BULL_QUEUE_PROVIDER, OtpQueue, OtpService],
})
export class QueuesModule {}
