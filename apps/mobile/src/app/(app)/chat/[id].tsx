import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { getErrorMessage, isApiError } from '@/api/errors';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ScreenAppBar } from '@/components/screen-app-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  isMessageStreaming,
  textFromUIMessage,
  toUIMessages,
} from '@/lib/chat-messages';
import { createCoachChatTransport } from '@/lib/chat-transport';
import { ChatsQueries, useChatDetail } from '@/queries/chats.queries';

export default function ChatThreadScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string }>();
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data, isLoading, isError, error } = useChatDetail(
    conversationId ?? '',
  );

  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<UIMessage>>(null);
  const seededRef = useRef<string | null>(null);

  const transport = useMemo(
    () =>
      conversationId
        ? createCoachChatTransport(conversationId)
        : createCoachChatTransport('000000000000000000000000'),
    [conversationId],
  );

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    clearError,
  } = useChat({
    id: conversationId,
    transport,
    onFinish: () => {
      if (!conversationId) return;
      void queryClient.invalidateQueries({ queryKey: ChatsQueries.keys.all });
      void queryClient.invalidateQueries({
        queryKey: ChatsQueries.keys.detail(conversationId),
      });
    },
    onError: (err) => {
      const message = getErrorMessage(err, 'Couldn’t send that message.');
      const isCredits =
        /credit/i.test(message) ||
        (isApiError(err) && err.isPaymentRequired);
      Alert.alert(isCredits ? 'Out of credits' : 'Send failed', message);
    },
  });

  useEffect(() => {
    seededRef.current = null;
    setMessages([]);
    setDraft('');
    clearError();
  }, [conversationId, setMessages, clearError]);

  useEffect(() => {
    if (!data || !conversationId) return;
    if (seededRef.current === conversationId) return;
    if (status !== 'ready') return;

    seededRef.current = conversationId;
    setMessages(toUIMessages(data.messages));
  }, [conversationId, data, setMessages, status]);

  const title = data?.title?.trim() || 'Coach';
  const sending = status === 'submitted' || status === 'streaming';

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, scrollToEnd]);

  const send = useCallback(async () => {
    const content = draft.trim();
    if (!content || !conversationId || sending) return;

    setDraft('');
    await sendMessage({ text: content });
  }, [conversationId, draft, sendMessage, sending]);

  const keyExtractor = useCallback((item: UIMessage) => item.id, []);

  const renderItem = useCallback(({ item }: { item: UIMessage }) => {
    if (item.role !== 'user' && item.role !== 'assistant') return null;
    return (
      <MessageBubble
        role={item.role}
        content={textFromUIMessage(item)}
        streaming={isMessageStreaming(item)}
      />
    );
  }, []);

  const listEmpty = useMemo(() => {
    if (isLoading) return null;
    return (
      <View style={styles.empty}>
        <ThemedText fontWeight="700" style={styles.emptyTitle}>
          What’s on your mind?
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
          Ask about workouts, recovery, or form — your coach is here.
        </ThemedText>
      </View>
    );
  }, [isLoading]);

  if (!conversationId) {
    return (
      <ThemedView style={styles.screen}>
        <ScreenAppBar title="Chat" />
        <View style={styles.centered}>
          <ThemedText>Conversation not found.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <ScreenAppBar title={title} onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        {isLoading && messages.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Brand.accent} />
          </View>
        ) : null}

        {isError && messages.length === 0 ? (
          <View style={styles.centered}>
            <ThemedText style={styles.errorTitle}>
              Couldn’t open chat
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.errorBody}>
              {isApiError(error)
                ? error.message
                : getErrorMessage(error, 'Try again in a moment.')}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.list,
              messages.length === 0 && styles.listEmpty,
            ]}
            ListEmptyComponent={listEmpty}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollToEnd}
          />
        )}

        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          <View
            style={[
              styles.composerBar,
              {
                backgroundColor: theme.background,
                borderTopColor: theme.border,
                paddingBottom: Math.max(insets.bottom, Spacing.two),
              },
            ]}>
            <View style={styles.composerInner}>
              <ChatComposer
                value={draft}
                onChangeText={setDraft}
                onSend={() => {
                  void send();
                }}
                sending={sending}
                disabled={isLoading && messages.length === 0}
              />
            </View>
          </View>
        </KeyboardStickyView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  list: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  emptyTitle: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  composerBar: {
    borderTopWidth: StyleSheet.hairlineWidth || 1,
    paddingTop: Spacing.two,
  },
  composerInner: {
    alignSelf: 'center',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    width: '100%',
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
