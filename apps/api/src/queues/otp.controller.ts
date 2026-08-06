import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { z } from 'zod';

import { Public } from '../common/decorators';
import { zodPipe } from '../common/zod-validation.pipe';
import { OtpService } from './otp.service';

// Validation schemas
const sendOtpSchema = z.object({
  type: z.literal('email').default('email'),
  contact: z.string().min(1, 'Contact is required'),
  purpose: z
    .enum(['registration', 'login', 'password_reset'])
    .default('registration'),
  userId: z.string().optional(),
});

const verifyOtpSchema = z.object({
  type: z.literal('email').default('email'),
  contact: z.string().min(1, 'Contact is required'),
  code: z.string().min(1, 'OTP code is required'),
  purpose: z
    .enum(['registration', 'login', 'password_reset'])
    .default('registration'),
});

const resendOtpSchema = z.object({
  type: z.literal('email').default('email'),
  contact: z.string().min(1, 'Contact is required'),
  purpose: z
    .enum(['registration', 'login', 'password_reset'])
    .default('registration'),
  userId: z.string().optional(),
});

type SendOtpInput = z.infer<typeof sendOtpSchema>;
type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
type ResendOtpInput = z.infer<typeof resendOtpSchema>;

/**
 * OTP Controller - handles OTP-related API endpoints
 */
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  /**
   * Send OTP to a contact (email or phone)
   */
  @Public()
  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(
    @Body(zodPipe(sendOtpSchema)) body: SendOtpInput,
  ): Promise<{ success: boolean; jobId: string; message?: string }> {
    return this.otpService.sendOtp(
      body.type,
      body.contact,
      body.purpose,
      body.userId,
    );
  }

  /**
   * Verify OTP code
   */
  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body(zodPipe(verifyOtpSchema)) body: VerifyOtpInput,
  ): Promise<{ success: boolean; message?: string; userId?: string }> {
    return this.otpService.verifyOtp(
      body.type,
      body.contact,
      body.code,
      body.purpose,
    );
  }

  /**
   * Resend OTP to a contact
   */
  @Public()
  @Post('resend')
  @HttpCode(HttpStatus.OK)
  async resendOtp(
    @Body(zodPipe(resendOtpSchema)) body: ResendOtpInput,
  ): Promise<{ success: boolean; jobId: string; message?: string }> {
    return this.otpService.resendOtp(
      body.type,
      body.contact,
      body.purpose,
      body.userId,
    );
  }
}
