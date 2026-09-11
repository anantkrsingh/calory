import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import {
  NOTIFICATION_QUEUE_NAME,
  type NotificationJobData,
  type NotificationJobResult,
} from '@fitness/types';

import { BULL_QUEUE_PROVIDER, type QueueProvider } from './queues.constants';

export {
  NOTIFICATION_QUEUE_NAME,
  type NotificationJobData,
  type NotificationJobResult,
};

@Injectable()
export class NotificationQueue {
  private readonly logger = new Logger(NotificationQueue.name);
  private readonly queue: Queue;

  constructor(
    @Inject(BULL_QUEUE_PROVIDER) private readonly queueProvider: QueueProvider,
  ) {
    this.queue = this.queueProvider(NOTIFICATION_QUEUE_NAME);
  }

  /** `delayMs` of 0 dispatches on the next worker tick — i.e. "now". */
  async dispatch(
    campaignId: string,
    delayMs: number,
  ): Promise<Job<NotificationJobResult> | null> {
    try {
      // jobId keyed on the campaign so a retry (or a double form submit)
      // cannot queue the same send twice.
      const job = await this.queue.add(
        'dispatchCampaign',
        { campaignId } satisfies NotificationJobData,
        { jobId: `notification-${campaignId}`, delay: delayMs, attempts: 1 },
      );
      this.logger.debug(`Notification job queued: ${job.id}`);
      return job as Job<NotificationJobResult>;
    } catch (error) {
      this.logger.error(
        `Failed to queue notification job for ${campaignId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  /** Pulls a still-delayed campaign out of the queue. No-op once it has started. */
  async cancel(campaignId: string): Promise<boolean> {
    try {
      const job = await this.queue.getJob(`notification-${campaignId}`);
      if (!job) return false;

      const state = await job.getState();
      if (state !== 'delayed' && state !== 'waiting') return false;

      await job.remove();
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to cancel notification job for ${campaignId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }
}
