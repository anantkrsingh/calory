import type { AuthProvider } from '@fitness/types';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { hasCompletedOnboarding } from '@/lib/onboarding';
import { SocialAuthCancelledError } from '@/lib/social-auth';
import { useSocialLogin as useSocialLoginMutation } from '@/queries/auth.queries';

interface UseSocialLoginResult {
  signIn: (provider: AuthProvider) => Promise<void>;
  isPending: boolean;
  error: string | null;
  clearError: () => void;
}

export function useSocialLogin(disabled = false): UseSocialLoginResult {
  const router = useRouter();
  const socialLogin = useSocialLoginMutation();
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(
    async (provider: AuthProvider) => {
      if (socialLogin.isPending || disabled) return;

      setError(null);

      try {
        const session = await socialLogin.mutateAsync(provider);
        router.replace(
          hasCompletedOnboarding(session.user) ? '/' : '/auth/onboarding',
        );
      } catch (cause) {
        if (cause instanceof SocialAuthCancelledError) return;
        console.error(`[social-login:${provider}]`, cause);
        setError(
          cause instanceof Error
            ? cause.message
            : `Could not sign in with ${provider}. Please try again.`,
        );
      }
    },
    [disabled, socialLogin, router],
  );

  return {
    signIn,
    isPending: socialLogin.isPending,
    error,
    clearError: useCallback(() => setError(null), []),
  };
}
