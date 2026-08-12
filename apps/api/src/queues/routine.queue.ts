import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import {
  ROUTINE_QUEUE_NAME,
  type RoutineJobData,
  type RoutineJobResult,
} from '@fitness/types';

import { BULL_QUEUE_PROVIDER, type QueueProvider } from './queues.constants';

export { ROUTINE_QUEUE_NAME, type RoutineJobData, type RoutineJobResult };

@Injectable()
export class RoutineQueue {
  private readonly logger = new Logger(RoutineQueue.name);
  private readonly queue: Queue;

  constructor(
    @Inject(BULL_QUEUE_PROVIDER) private readonly queueProvider: QueueProvider,
  ) {
    this.queue = this.queueProvider(ROUTINE_QUEUE_NAME);
  }

  async generate(data: RoutineJobData): Promise<Job<RoutineJobResult> | null> {
    try {
      // jobId keyed on the routine so a retry cannot queue a duplicate.
      const job = await this.queue.add('generateRoutine', data, {
        jobId: `routine-${data.routineId}`,
        attempts: 3,
        // LLM calls fail on rate limits; back off further than the queue default.
        backoff: { type: 'exponential', delay: 20_000 },
      });
      this.logger.debug(`Routine job queued: ${job.id}`);
      return job as Job<RoutineJobResult>;
    } catch (error) {
      this.logger.error(
        `Failed to queue routine job for ${data.routineId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }
}
