import type { User } from '@fitness/types';
import type { RegisterPushTokenInput, UpdateUserInput } from '@fitness/validation';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { usersService, type LocalImageFile } from '@/services/users.service';
import { authState } from '@/stores/auth.store';

import { AuthQueries } from './auth.queries';

export function useUpdateProfile(): UseMutationResult<
  User,
  Error,
  UpdateUserInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserInput) => usersService.update(input),
    onSuccess: (user) => {
      queryClient.setQueryData(AuthQueries.keys.me(), user);
      // Keeps the navigation guard's onboarding-completeness check current —
      // it reads off this store, not the query cache.
      authState.setUser(user);
    },
  });
}

export function useUploadAvatar(): UseMutationResult<
  User,
  Error,
  LocalImageFile
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: LocalImageFile) => usersService.uploadAvatar(file),
    onSuccess: (user) => {
      queryClient.setQueryData(AuthQueries.keys.me(), user);
      authState.setUser(user);
    },
  });
}

/** Saves this device's Expo push token; the backend flips `preferences.notificationsEnabled` on. */
export function useRegisterPushToken(): UseMutationResult<
  void,
  Error,
  RegisterPushTokenInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterPushTokenInput) =>
      usersService.registerPushToken(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AuthQueries.keys.me() });
    },
  });
}
