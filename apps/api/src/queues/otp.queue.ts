import { Injectable, Inject, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import type { Env } from '@fitness/config/server';

import { ENV } from '../config/env.module';
import { BULL_QUEUE_PROVIDER, type QueueProvider } from './queues.constants';

/**
 * Data payload for OTP jobs
 */
export interface OtpJobData {
  type: 'email' | 'sms';
  to: string; // email address or phone number
  otp: string;
  userId?: string;
  purpose: 'registration' | 'login' | 'password_reset';
}

/**
 * Result of an OTP job
 */
export interface OtpJobResult {
  success: boolean;
  message?: string;
  sentAt: Date;
  expiresAt: Date;
}

/**
 * Queue name for OTP jobs
 */
export const OTP_QUEUE_NAME = 'otp';

/**
 * OTP Queue service - handles adding OTP jobs to the queue
 */
@Injectable()
export class OtpQueue {
  private readonly logger = new Logger(OtpQueue.name);
  private otpQueue: Queue;

  constructor(
    @ENV private readonly env: Env,
    @Inject(BULL_QUEUE_PROVIDER)
    private readonly queueProvider: QueueProvider,
  ) {
    this.otpQueue = this.queueProvider(OTP_QUEUE_NAME);
  }

  /**
   * Add a new OTP job to the queue
   */
  async sendOtp(data: OtpJobData): Promise<Job<OtpJobResult>> {
    const job = await this.otpQueue.add(
      'sendOtp',
      data,
      {
        // OTP jobs should be processed quickly
        priority: 1,
        // Job expires after OTP expiry time + some buffer
        jobId: `otp:${data.type}:${data.to}:${Date.now()}`,
      },
    );

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
      const [localPart, domain] = contact.split('@');
      return `${localPart[0]}****@${domain}`;
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

/**
 * OTP Queue Processor - handles processing OTP jobs
 */
@Processor(OTP_QUEUE_NAME)
export class OtpQueueProcessor {
  private readonly logger = new Logger(OtpQueueProcessor.name);

  constructor(@ENV private readonly env: Env) {}

  /**
   * Process OTP sending jobs
   */
  @Process('sendOtp')
  async handleSendOtp(job: Job<OtpJobData>): Promise<OtpJobResult> {
    const { type, to, otp, purpose } = job.data;

    this.logger.log(
      `Processing OTP job ${job.id}: sending ${type} to ${this.maskContact(to)}`,
    );

    try {
      let success = false;
      let message: string | undefined;

      if (type === 'email') {
        // In production, integrate with email service
        success = await this.sendEmailOtp(to, otp, purpose);
        message = `OTP email sent to ${this.maskContact(to)}`;
      } else if (type === 'sms') {
        // In production, integrate with SMS service
        success = await this.sendSmsOtp(to, otp, purpose);
        message = `OTP SMS sent to ${this.maskContact(to)}`;
      }

      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + this.env.OTP_EXPIRY_MINUTES * 60000,
      );

      if (success) {
        this.logger.log(
          `OTP job ${job.id} completed: ${type} sent to ${this.maskContact(to)}`,
        );
      } else {
        this.logger.warn(
          `OTP job ${job.id} failed: could not send ${type} to ${this.maskContact(to)}`,
        );
      }

      return {
        success,
        message,
        sentAt: now,
        expiresAt,
      };
    } catch (error) {
      this.logger.error(`OTP job ${job.id} failed with error: ${error}`);
      throw error;
    }
  }

  /**
   * Send OTP via email
   * In production, replace with actual email service integration
   */
  private async sendEmailOtp(
    email: string,
    otp: string,
    purpose: string,
  ): Promise<boolean> {
    // TODO: Integrate with SendGrid, Mailgun, AWS SES, etc.
    this.logger.log(
      `[DEV] OTP for ${this.maskContact(email)}: ${otp} (purpose: ${purpose})`,
    );
    
    // In development, we'll just log the OTP
    // In production, this would send an actual email
    return true;
  }

  /**
   * Send OTP via SMS
   * In production, replace with actual SMS service integration
   */
  private async sendSmsOtp(
    phone: string,
    otp: string,
    purpose: string,
  ): Promise<boolean> {
    // TODO: Integrate with Twilio, AWS SNS, etc.
    this.logger.log(
      `[DEV] OTP for ${this.maskContact(phone)}: ${otp} (purpose: ${purpose})`,
    );
    
    // In development, we'll just log the OTP
    // In production, this would send an actual SMS
    return true;
  }

  /**
   * Mask contact information for logging (privacy)
   */
  private maskContact(contact: string): string {
    if (contact.includes('@')) {
      // Email
      const [localPart, domain] = contact.split('@');
      return `${localPart[0]}****@${domain}`;
    } else {
      // Phone - show last 4 digits
      return contact.slice(-4).padStart(contact.length, '*');
    }
  }

  /**
   * Event handlers for queue monitoring
   */
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`OTP Queue: Job ${job.id} is now active`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: OtpJobResult) {
    this.logger.debug(
      `OTP Queue: Job ${job.id} completed with result: ${JSON.stringify(result)}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `OTP Queue: Job ${job.id} failed with error: ${error.message}`,
    );
  }
}
