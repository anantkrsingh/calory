import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
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
 *
 * Uses bullmq's `Worker` directly (not `@nestjs/bull`, which wraps the older,
 * wire-incompatible `bull` package) so it actually consumes jobs added by the
 * API's `bullmq.Queue` producer.
 */
@Injectable()
export class OtpQueueProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OtpQueueProcessor.name);
  private readonly transporter: Transporter;
  private worker?: Worker<OtpJobData, OtpJobResult>;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.transporter = createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        env.SMTP_USER && env.SMTP_PASSWORD
          ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
          : undefined,
    });
  }

  onModuleInit(): void {
    this.worker = new Worker<OtpJobData, OtpJobResult>(
      OTP_QUEUE_NAME,
      (job) => this.handleSendOtp(job),
      {
        connection: {
          host: this.env.REDIS_HOST,
          port: this.env.REDIS_PORT,
          password: this.env.REDIS_PASSWORD,
          maxRetriesPerRequest: null,
        },
        prefix: 'fitness',
      },
    );

    this.worker.on('active', (job) => {
      this.logger.debug(`OTP Queue: Job ${job.id} is now active`);
    });

    this.worker.on('completed', (job, result) => {
      this.logger.debug(
        `OTP Queue: Job ${job.id} completed with result: ${JSON.stringify(result)}`,
      );
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `OTP Queue: Job ${job?.id} failed with error: ${error.message}`,
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    this.transporter.close();
  }

  private async handleSendOtp(job: Job<OtpJobData>): Promise<OtpJobResult> {
    const { to, otp, purpose } = job.data;

    this.logger.log(
      `Processing OTP job ${job.id}: sending email to ${this.maskContact(to)} ${this.env.SMTP_PASSWORD}`,
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

  private maskContact(contact: string): string {
    const [localPart = '', domain = ''] = contact.split('@');
    return `${localPart[0] ?? ''}****@${domain}`;
  }
}
