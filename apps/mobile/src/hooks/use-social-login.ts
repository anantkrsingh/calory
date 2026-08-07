import type { AuthProvider } from '@fitness/types';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

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
  const mutation = useSocialLoginMutation();
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(
    async (provider: AuthProvider) => {
      if (mutation.isPending || disabled) return;

      setError(null);

      try {
        await mutation.mutateAsync(provider);
        router.replace('/');
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
    [disabled, mutation, router],
  );

  return {
    signIn,
    isPending: mutation.isPending,
    error,
    clearError: useCallback(() => setError(null), []),
  };
}
