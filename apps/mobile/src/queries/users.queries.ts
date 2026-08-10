import type { User } from '@fitness/types';
import type { UpdateUserInput } from '@fitness/validation';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { usersService } from '@/services/users.service';
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
