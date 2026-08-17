import { http } from '@/api/http';

export type OtpPurpose = 'registration' | 'login' | 'password_reset';

interface SendOtpResponse {
  success: boolean;
  message?: string;
}

interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  userId?: string;
}

class OTPService {
  async sendOTP(email: string, purpose: OtpPurpose = 'registration'): Promise<SendOtpResponse> {
    const { data } = await http.post<SendOtpResponse>(
      '/otp/send',
      { type: 'email', contact: email, purpose },
      { skipAuth: true },
    );
    return data;
  }

  async verifyOTP(
    email: string,
    code: string,
    purpose: OtpPurpose = 'registration',
  ): Promise<VerifyOtpResponse> {
    const { data } = await http.post<VerifyOtpResponse>(
      '/otp/verify',
      { type: 'email', contact: email, code, purpose },
      { skipAuth: true },
    );

    return data;
  }

  async resendOTP(email: string, purpose: OtpPurpose = 'registration'): Promise<SendOtpResponse> {
    const { data } = await http.post<SendOtpResponse>(
      '/otp/resend',
      { type: 'email', contact: email, purpose },
      { skipAuth: true },
    );
    return data;
  }
}

export const otpService = new OTPService();
