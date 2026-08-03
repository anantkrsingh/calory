import { authService } from './auth.service';

class OTPService {
  // Store OTPs temporarily (in production, this would be handled by backend)
  private otpStore: Record<string, { code: string; expiresAt: number }> = {};

  // OTP expires in 10 minutes
  private readonly OTP_EXPIRY_MS = 10 * 60 * 1000;

  /**
   * Generate a 6-digit OTP code
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to the specified email
   * In production, this would call your backend API to send email/SMS
   */
  async sendOTP(email: string): Promise<void> {
    const otp = this.generateOTP();
    const expiresAt = Date.now() + this.OTP_EXPIRY_MS;

    this.otpStore[email] = {
      code: otp,
      expiresAt,
    };

    // In production, replace with actual API call
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  /**
   * Verify the OTP code for the specified email
   */
  async verifyOTP(email: string, code: string): Promise<boolean> {
    const stored = this.otpStore[email];

    if (!stored) {
      return false;
    }

    // Check if OTP has expired
    if (Date.now() > stored.expiresAt) {
      delete this.otpStore[email];
      return false;
    }

    // Check if code matches
    const isValid = stored.code === code;

    if (isValid) {
      // Clean up after successful verification
      delete this.otpStore[email];
    }

    return isValid;
  }

  /**
   * Resend OTP for the specified email
   */
  async resendOTP(email: string): Promise<void> {
    // Clear any existing OTP for this email
    delete this.otpStore[email];
    await this.sendOTP(email);
  }

  /**
   * Clear OTP for a specific email
   */
  clearOTP(email: string): void {
    delete this.otpStore[email];
  }

  /**
   * Clear all OTPs (useful for testing or logout)
   */
  clearAllOTPs(): void {
    this.otpStore = {};
  }

  /**
   * Get remaining time for OTP expiry (for countdown timer)
   */
  getRemainingTime(email: string): number {
    const stored = this.otpStore[email];
    if (!stored) return 0;

    const remaining = stored.expiresAt - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Format remaining time as MM:SS
   */
  formatRemainingTime(email: string): string {
    const remainingMs = this.getRemainingTime(email);
    const seconds = Math.ceil(remainingMs / 1000);
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export const otpService = new OTPService();
