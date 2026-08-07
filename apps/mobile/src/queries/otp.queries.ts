import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { otpService, type OtpPurpose } from '@/services/otp.service';

interface SendOtpInput {
  email: string;
  purpose?: OtpPurpose;
}

interface VerifyOtpInput {
  email: string;
  code: string;
  purpose?: OtpPurpose;
}

export function useSendOtp(): UseMutationResult<
  Awaited<ReturnType<typeof otpService.sendOTP>>,
  Error,
  SendOtpInput
> {
  return useMutation({
    mutationFn: ({ email, purpose = 'registration' }: SendOtpInput) =>
      otpService.sendOTP(email, purpose),
  });
}

export function useVerifyOtp(): UseMutationResult<boolean, Error, VerifyOtpInput> {
  return useMutation({
    mutationFn: ({ email, code, purpose = 'registration' }: VerifyOtpInput) =>
      otpService.verifyOTP(email, code, purpose),
  });
}
