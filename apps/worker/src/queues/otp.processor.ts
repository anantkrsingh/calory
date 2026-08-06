import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job } from 'bullmq';
import { createTransport, type Transporter } from 'nodemailer';
import type { Env } from '@fitness/config/server';
import {
  OTP_QUEUE_NAME,
  type OtpJobData,
  type OtpJobResult,
} from '@fitness/types';

import { ENV } from '../config/env.module';

/**
 * OTP Queue Processor - sends OTP codes by email via nodemailer.
 */
@Processor(OTP_QUEUE_NAME)
@Injectable()
export class OtpQueueProcessor implements OnModuleDestroy {
  private readonly logger = new Logger(OtpQueueProcessor.name);
  private readonly transporter: Transporter;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.transporter = createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASSWORD
          ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
          : undefined,
    });
  }

  onModuleDestroy(): void {
    this.transporter.close();
  }

  /**
   * Process OTP sending jobs
   */
  @Process('sendOtp')
  async handleSendOtp(job: Job<OtpJobData>): Promise<OtpJobResult> {
    const { to, otp, purpose } = job.data;

    this.logger.log(
      `Processing OTP job ${job.id}: sending email to ${this.maskContact(to)}`,
    );

    try {
      await this.sendOtpEmail(to, otp, purpose);

      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + (this.env.OTP_EXPIRY_MINUTES || 10) * 60000,
      );

      this.logger.log(
        `OTP job ${job.id} completed: email sent to ${this.maskContact(to)}`,
      );

      return {
        success: true,
        message: `OTP email sent to ${this.maskContact(to)}`,
        sentAt: now,
        expiresAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`OTP job ${job.id} failed with error: ${message}`);
      throw error;
    }
  }

  private async sendOtpEmail(
    email: string,
    otp: string,
    purpose: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.env.SMTP_FROM,
      to: email,
      subject: 'Your verification code',
      text: `Your OTP code is ${otp}. It expires in ${this.env.OTP_EXPIRY_MINUTES} minutes. (${purpose})`,
    });
  }

  /**
   * Mask contact information for logging (privacy)
   */
  private maskContact(contact: string): string {
    const [localPart = '', domain = ''] = contact.split('@');
    return `${localPart[0] ?? ''}****@${domain}`;
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
