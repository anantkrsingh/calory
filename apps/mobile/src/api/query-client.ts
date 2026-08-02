import { QueryClient } from '@tanstack/react-query';

import { isApiError } from './errors';

/**
 * Retrying a 4xx just repeats a request the server already rejected, so only
 * network/5xx failures get a second chance.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
