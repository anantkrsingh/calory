/** BullMQ queue name for OTP delivery jobs. Shared so the API (producer) and the worker (consumer) agree on it. */
export const OTP_QUEUE_NAME = 'otp';

export interface OtpJobData {
  type: 'email';
  to: string;
  otp: string;
  userId?: string;
  purpose: 'registration' | 'login' | 'password_reset';
}

export interface OtpJobResult {
  success: boolean;
  message?: string;
  sentAt: Date;
  expiresAt: Date;
}
