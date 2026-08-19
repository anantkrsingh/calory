import type {
  ChatConversation,
  ChatConversationDetail,
  ChatMessage,
  Paginated,
} from '@fitness/types';
import type {
  ChatMessageQueryInput,
  ChatQueryInput,
  CreateChatInput,
  SendChatMessageInput,
  UpdateChatInput,
} from '@fitness/validation';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { chatsService } from '@/services/chats.service';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

export class ChatsQueries {
  static readonly root = ['chats'] as const;

  static keys = {
    all: ChatsQueries.root,
    list: (query: ChatQueryInput = {}) =>
      [...ChatsQueries.root, 'list', query] as const,
    detail: (id: string) => [...ChatsQueries.root, 'detail', id] as const,
    messages: (id: string, query: ChatMessageQueryInput = {}) =>
      [...ChatsQueries.root, 'messages', id, query] as const,
  };

  static list(enabled: boolean, query: ChatQueryInput = {}) {
    return queryOptions({
      queryKey: ChatsQueries.keys.list(query),
      queryFn: () => chatsService.list(query),
      enabled,
    });
  }

  static detail(enabled: boolean, id: string) {
    return queryOptions({
      queryKey: ChatsQueries.keys.detail(id),
      queryFn: () => chatsService.get(id),
      enabled: enabled && Boolean(id),
    });
  }

  static messages(
    enabled: boolean,
    id: string,
    query: ChatMessageQueryInput = {},
  ) {
    return queryOptions({
      queryKey: ChatsQueries.keys.messages(id, query),
      queryFn: () => chatsService.listMessages(id, query),
      enabled: enabled && Boolean(id),
    });
  }
}

export function useChats(
  query: ChatQueryInput = {},
): UseQueryResult<Paginated<ChatConversation>> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(ChatsQueries.list(isAuthenticated, query));
}

export function useChat(
  id: string,
): UseQueryResult<ChatConversationDetail> {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery(ChatsQueries.detail(isAuthenticated, id));
}

export function useCreateChat(): UseMutationResult<
  ChatConversation,
  Error,
  CreateChatInput | undefined
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input = {}) => chatsService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ChatsQueries.keys.all });
    },
  });
}

export function useUpdateChat(): UseMutationResult<
  ChatConversation,
  Error,
  { id: string; input: UpdateChatInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => chatsService.update(id, input),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({ queryKey: ChatsQueries.keys.all });
      void queryClient.invalidateQueries({
        queryKey: ChatsQueries.keys.detail(conversation.id),
      });
    },
  });
}

export function useDeleteChat(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => chatsService.remove(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ChatsQueries.keys.all });
      queryClient.removeQueries({ queryKey: ChatsQueries.keys.detail(id) });
    },
  });
}

export type StreamChatVariables = {
  conversationId: string;
  input: SendChatMessageInput;
  onUserMessageId?: (id: string) => void;
  onChunk: (text: string) => void;
};

export function useStreamChatMessage(): UseMutationResult<
  string,
  Error,
  StreamChatVariables
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, input, onUserMessageId, onChunk }) =>
      chatsService.streamMessage(conversationId, input, {
        onUserMessageId,
        onChunk,
      }),
    onSuccess: (_text, { conversationId }) => {
      void queryClient.invalidateQueries({ queryKey: ChatsQueries.keys.all });
      void queryClient.invalidateQueries({
        queryKey: ChatsQueries.keys.detail(conversationId),
      });
      void queryClient.invalidateQueries({
        queryKey: [...ChatsQueries.root, 'messages', conversationId],
      });
    },
  });
}
