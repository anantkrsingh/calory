import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import {
  otpSendResponseSchema,
  otpVerifyResponseSchema,
} from '@fitness/validation';

import { Public } from '../common/decorators';
import { ApiZodBody, ApiZodResponse } from '../common/swagger';
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
@ApiTags('otp')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  /**
   * Send OTP to a contact (email or phone)
   */
  @Public()
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Queue a one-time code to an email address' })
  @ApiZodBody(sendOtpSchema)
  @ApiZodResponse(otpSendResponseSchema, {
    description: 'Code queued',
    name: 'OtpSendResult',
  })
  async sendOtp(
    @Body(zodPipe(sendOtpSchema)) body: SendOtpInput,
  ): Promise<{ success: boolean; message?: string }> {
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
  @ApiOperation({ summary: 'Verify a one-time code' })
  @ApiZodBody(verifyOtpSchema)
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiZodResponse(otpVerifyResponseSchema, {
    description: 'Verification outcome',
    name: 'OtpVerifyResult',
  })
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
  @ApiOperation({
    summary: 'Queue a fresh one-time code, invalidating the previous one',
  })
  @ApiZodBody(resendOtpSchema)
  @ApiZodResponse(otpSendResponseSchema, {
    description: 'Fresh code queued',
    name: 'OtpSendResult',
  })
  async resendOtp(
    @Body(zodPipe(resendOtpSchema)) body: ResendOtpInput,
  ): Promise<{ success: boolean; message?: string }> {
    return this.otpService.resendOtp(
      body.type,
      body.contact,
      body.purpose,
      body.userId,
    );
  }
}
