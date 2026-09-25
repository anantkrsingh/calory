export const OTP_QUEUE_NAME = 'otp';

export interface OtpJobData {
  type: 'email';
  to: string;
  otp: string;
  userId?: string;
  purpose: 'registration' | 'login' | 'password_reset' | 'email_change';
}

export interface OtpJobResult {
  success: boolean;
  message?: string;
  sentAt: Date;
  expiresAt: Date;
}
