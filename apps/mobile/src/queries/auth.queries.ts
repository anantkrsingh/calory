import type { AuthSession, User } from '@fitness/types';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from '@fitness/validation';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { authService } from '@/services/auth.service';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

/**
 * Query keys and options for the auth resource. Static members so callers can
 * reach them from imperative code (`queryClient.invalidateQueries`) as well as
 * from the hooks below.
 */
export class AuthQueries {
  static readonly root = ['auth'] as const;

  static keys = {
    all: AuthQueries.root,
    me: () => [...AuthQueries.root, 'me'] as const,
  };

  /** The signed-in user. Enabled only once a token exists, so it never 401s on boot. */
  static me(enabled: boolean) {
    return queryOptions({
      queryKey: AuthQueries.keys.me(),
      queryFn: () => authService.me(),
      enabled,
      staleTime: 5 * 60 * 1000,
    });
  }
}

export function useMe(): UseQueryResult<User> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(AuthQueries.me(isAuthenticated));
}

export function useLogin(): UseMutationResult<AuthSession, Error, LoginInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: (session) => {
      // Seeds `useMe` from the login response so the first screen renders
      // without a second round trip.
      queryClient.setQueryData(AuthQueries.keys.me(), session.user);
    },
  });
}

export function useRegister(): UseMutationResult<
  AuthSession,
  Error,
  RegisterInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
    onSuccess: (session) => {
      queryClient.setQueryData(AuthQueries.keys.me(), session.user);
    },
  });
}

export function useLogout(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    // Runs on failure too: `authService.logout` clears the store either way,
    // so leaving another user's data cached would be wrong.
    onSettled: () => {
      queryClient.clear();
    },
  });
}

export function useChangePassword(): UseMutationResult<
  void,
  Error,
  ChangePasswordInput
> {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      authService.changePassword(input),
  });
}
