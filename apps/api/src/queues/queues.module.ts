import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';

import { BULL_QUEUE_PROVIDER, QueueProvider } from './queues.constants';
import { OtpController } from './otp.controller';
import { OtpQueue } from './otp.queue';
import { OtpService } from './otp.service';
import { RoutineQueue } from './routine.queue';

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
 * Global queue module — producer side only. Adds OTP jobs to the queue.
 * Job processing happens in the separate `@fitness/worker` app.
 */
@Global()
@Module({
  providers: [
    {
      provide: BULL_QUEUE_PROVIDER,
      useValue: queueProvider,
    },
    OtpQueue,
    OtpService,
    RoutineQueue
  ],
  controllers: [OtpController],
  exports: [BULL_QUEUE_PROVIDER, OtpQueue, OtpService, RoutineQueue],
})
export class QueuesModule {}
