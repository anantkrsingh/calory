import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Env } from '@fitness/config/server';

import { ENV } from '../config/env.module';
import { OtpQueue, type OtpJobData } from './otp.queue';

/**
 * OTP storage for verification (in-memory, replace with Redis in production)
 */
interface StoredOtp {
  code: string;
  contact: string;
  type: 'email';
  purpose: string;
  userId?: string;
  expiresAt: Date;
  jobId: string;
}

/**
 * OTP Service - manages OTP generation, sending, and verification
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpStore = new Map<string, StoredOtp>();

  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly otpQueue: OtpQueue,
  ) {}

  /**
   * Generate and send an OTP to the specified contact
   */
  async sendOtp(
    type: 'email',
    contact: string,
    purpose: 'registration' | 'login' | 'password_reset',
    userId?: string,
  ): Promise<{ success: boolean; jobId: string; message?: string }> {
    // Generate OTP
    const otp = this.otpQueue.generateOtp();

    const expiresAt = new Date(
      Date.now() + (this.env.OTP_EXPIRY_MINUTES || 10) * 60000,
    );

    const jobData: OtpJobData = {
      type,
      to: contact,
      otp,
      purpose,
      userId,
    };

    const job = await this.otpQueue.sendOtp(jobData);
    const jobId = job.id ?? '';

    const otpKey = this.getOtpKey(type, contact, purpose);
    this.otpStore.set(otpKey, {
      code: otp,
      contact,
      type,
      purpose,
      userId,
      expiresAt,
      jobId,
    });

    this.cleanupExpiredOtps();


    return {
      success: true,
      jobId,
      message: `OTP sent to ${type}`,
    };
  }

  async verifyOtp(
    type: 'email',
    contact: string,
    code: string,
    purpose: 'registration' | 'login' | 'password_reset',
  ): Promise<{ success: boolean; message?: string; userId?: string }> {
    const otpKey = this.getOtpKey(type, contact, purpose);
    const storedOtp = this.otpStore.get(otpKey);

    if (!storedOtp) {
      this.logger.warn(
        `OTP verification failed: no OTP found for ${type} ${this.maskContact(contact)}`,
      );
      return {
        success: false,
        message: 'No OTP found for this contact. Please request a new one.',
      };
    }

    // Check if expired
    if (new Date() > storedOtp.expiresAt) {
      this.otpStore.delete(otpKey);
      this.logger.warn(
        `OTP verification failed: OTP expired for ${type} ${this.maskContact(contact)}`,
      );
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.',
      };
    }

    // Check if code matches
    if (storedOtp.code !== code) {
      this.logger.warn(
        `OTP verification failed: invalid code for ${type} ${this.maskContact(contact)}`,
      );
      return {
        success: false,
        message: 'Invalid OTP code.',
      };
    }

    // OTP is valid - remove it and return success
    this.otpStore.delete(otpKey);

    this.logger.log(
      `OTP verified successfully for ${type} ${this.maskContact(contact)}`,
    );

    return {
      success: true,
      message: 'OTP verified successfully.',
      userId: storedOtp.userId,
    };
  }

  /**
   * Resend OTP for the specified contact
   */
  async resendOtp(
    type: 'email',
    contact: string,
    purpose: 'registration' | 'login' | 'password_reset',
    userId?: string,
  ): Promise<{ success: boolean; jobId: string; message?: string }> {
    // Invalidate any existing OTP for this contact/purpose
    const otpKey = this.getOtpKey(type, contact, purpose);
    this.otpStore.delete(otpKey);

    // Send new OTP
    return this.sendOtp(type, contact, purpose, userId);
  }

  /**
   * Clean up expired OTPs from the store
   */
  private cleanupExpiredOtps(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, otp] of this.otpStore.entries()) {
      if (now > otp.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.otpStore.delete(key);
    }

    if (expiredKeys.length > 0) {
      this.logger.debug(`Cleaned up ${expiredKeys.length} expired OTPs`);
    }
  }

  /**
   * Generate a unique key for OTP storage
   */
  private getOtpKey(type: string, contact: string, purpose: string): string {
    return `${type}:${contact.toLowerCase()}:${purpose}`;
  }

  /**
   * Mask contact information for logging (privacy)
   */
  private maskContact(contact: string): string {
    const [localPart = '', domain = ''] = contact.split('@');
    return `${localPart[0] ?? ''}****@${domain}`;
  }
}
