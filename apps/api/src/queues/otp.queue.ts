import { Injectable, Inject, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import type { Env } from '@fitness/config/server';
import {
  OTP_QUEUE_NAME,
  type OtpJobData,
  type OtpJobResult,
} from '@fitness/types';

import { ENV } from '../config/env.module';
import { BULL_QUEUE_PROVIDER, type QueueProvider } from './queues.constants';

export { OTP_QUEUE_NAME, type OtpJobData, type OtpJobResult };

/**
 * OTP Queue service - handles adding OTP jobs to the queue
 */
@Injectable()
export class OtpQueue {
  private readonly logger = new Logger(OtpQueue.name);
  private otpQueue: Queue;

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(BULL_QUEUE_PROVIDER)
    private readonly queueProvider: QueueProvider,
  ) {
    this.otpQueue = this.queueProvider(OTP_QUEUE_NAME);
  }

  /**
   * Add a new OTP job to the queue
   */
  async sendOtp(data: OtpJobData): Promise<Job<OtpJobResult>> {
    const job = await this.otpQueue.add('sendOtp', data, {
      // OTP jobs should be processed quickly
      priority: 1,
      // Job expires after OTP expiry time + some buffer
      jobId: `otp:${data.type}:${data.to}:${Date.now()}`,
    });

    this.logger.debug(
      `OTP job added to queue: ${job.id} for ${data.type} ${this.maskContact(data.to)}`,
    );

    return job;
  }

  /**
   * Mask contact information for logging (privacy)
   */
  private maskContact(contact: string): string {
    if (contact.includes('@')) {
      // Email
      const [localPart = '', domain = ''] = contact.split('@');
      return `${localPart[0] ?? ''}****@${domain}`;
    } else {
      // Phone - show last 4 digits
      return contact.slice(-4).padStart(contact.length, '*');
    }
  }

  /**
   * Generate a random OTP code
   */
  generateOtp(): string {
    const length = this.env.OTP_LENGTH || 6;
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    return otp;
  }
}
