import type { Paginated, SupportTicket, TicketAttachment } from '@fitness/types';
import type {
  AddTicketCommentInput,
  CreateTicketInput,
  ListTicketsQueryInput,
  ReopenTicketInput,
} from '@fitness/validation';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { LocalImageFile } from '@/services/users.service';
import { ticketsService } from '@/services/tickets.service';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

const DEFAULT_TICKET_QUERY: ListTicketsQueryInput = { page: 1, limit: 20 };

export class TicketsQueries {
  static readonly root = ['tickets'] as const;

  static keys = {
    all: TicketsQueries.root,
    list: (query: ListTicketsQueryInput) =>
      [...TicketsQueries.root, 'list', query] as const,
  };

  static list(
    enabled: boolean,
    query: ListTicketsQueryInput = DEFAULT_TICKET_QUERY,
  ) {
    return queryOptions({
      queryKey: TicketsQueries.keys.list(query),
      queryFn: () => ticketsService.list(query),
      enabled,
      staleTime: 60 * 1000,
    });
  }
}

export function useTickets(
  query: ListTicketsQueryInput = DEFAULT_TICKET_QUERY,
): UseQueryResult<Paginated<SupportTicket>> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(TicketsQueries.list(isAuthenticated, query));
}

export function useCreateTicket(): UseMutationResult<
  SupportTicket,
  Error,
  CreateTicketInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) => ticketsService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TicketsQueries.keys.all });
    },
  });
}

export function useAddTicketComment(): UseMutationResult<
  SupportTicket,
  Error,
  { id: string; input: AddTicketCommentInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => ticketsService.addComment(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TicketsQueries.keys.all });
    },
  });
}

export function useReopenTicket(): UseMutationResult<
  SupportTicket,
  Error,
  { id: string; input: ReopenTicketInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => ticketsService.reopen(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TicketsQueries.keys.all });
    },
  });
}

export function useUploadTicketAttachment(): UseMutationResult<
  TicketAttachment,
  Error,
  LocalImageFile
> {
  return useMutation({
    mutationFn: (file) => ticketsService.uploadAttachment(file),
  });
}
