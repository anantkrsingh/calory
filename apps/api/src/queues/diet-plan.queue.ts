import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import {
  DIET_PLAN_QUEUE_NAME,
  type DietPlanJobData,
  type DietPlanJobResult,
} from '@fitness/types';

import { BULL_QUEUE_PROVIDER, type QueueProvider } from './queues.constants';

export { DIET_PLAN_QUEUE_NAME, type DietPlanJobData, type DietPlanJobResult };

@Injectable()
export class DietPlanQueue {
  private readonly logger = new Logger(DietPlanQueue.name);
  private readonly queue: Queue;

  constructor(
    @Inject(BULL_QUEUE_PROVIDER) private readonly queueProvider: QueueProvider,
  ) {
    this.queue = this.queueProvider(DIET_PLAN_QUEUE_NAME);
  }

  async generate(
    data: DietPlanJobData,
  ): Promise<Job<DietPlanJobResult> | null> {
    try {
      // jobId keyed on the plan so a retry cannot queue a duplicate.
      const job = await this.queue.add('generateDietPlan', data, {
        jobId: `diet-plan-${data.dietPlanId}`,
        attempts: 3,
        // LLM calls fail on rate limits; back off further than the queue default.
        backoff: { type: 'exponential', delay: 20_000 },
      });
      this.logger.debug(`Diet plan job queued: ${job.id}`);
      return job as Job<DietPlanJobResult>;
    } catch (error) {
      this.logger.error(
        `Failed to queue diet plan job for ${data.dietPlanId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }
}
