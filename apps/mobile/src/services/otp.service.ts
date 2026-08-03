import { http } from '@/api/http';

export type OtpPurpose = 'registration' | 'login' | 'password_reset';

interface SendOtpResponse {
  success: boolean;
  jobId: string;
  message?: string;
}

interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  userId?: string;
}

class OTPService {
  sendOTP(email: string, purpose: OtpPurpose = 'registration'): Promise<SendOtpResponse> {
    return http.post<SendOtpResponse>('/otp/send', {
      body: { type: 'email', contact: email, purpose },
      skipAuth: true,
    });
  }

  async verifyOTP(email: string, code: string, purpose: OtpPurpose = 'registration'): Promise<boolean> {
    const result = await http.post<VerifyOtpResponse>('/otp/verify', {
      body: { type: 'email', contact: email, code, purpose },
      skipAuth: true,
    });

    return result.success;
  }

  resendOTP(email: string, purpose: OtpPurpose = 'registration'): Promise<SendOtpResponse> {
    return http.post<SendOtpResponse>('/otp/resend', {
      body: { type: 'email', contact: email, purpose },
      skipAuth: true,
    });
  }
}

export const otpService = new OTPService();
