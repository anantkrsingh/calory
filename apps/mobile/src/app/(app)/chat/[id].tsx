import type { ChatMessage } from '@fitness/types';
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

import { getErrorMessage, isApiError } from '@/api/errors';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ScreenAppBar } from '@/components/screen-app-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useChat, useStreamChatMessage } from '@/queries/chats.queries';

type ThreadMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
};

function toThreadMessage(message: ChatMessage): ThreadMessage | null {
  if (message.role === 'system') return null;
  return {
    id: message.id,
    role: message.role,
    content: message.content,
  };
}

export default function ChatThreadScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data, isLoading, isError, error } = useChat(conversationId);
  const streamMessage = useStreamChatMessage();

  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState<ThreadMessage[]>([]);
  const listRef = useRef<FlatList<ThreadMessage>>(null);
  const seededRef = useRef<string | null>(null);

  useEffect(() => {
    seededRef.current = null;
    setLocalMessages([]);
    setDraft('');
  }, [conversationId]);

  useEffect(() => {
    if (!data || !conversationId) return;
    if (seededRef.current === conversationId) return;
    if (streamMessage.isPending) return;

    seededRef.current = conversationId;
    setLocalMessages(
      data.messages
        .map(toThreadMessage)
        .filter((message): message is ThreadMessage => message !== null),
    );
  }, [conversationId, data, streamMessage.isPending]);

  const title = data?.title?.trim() || 'Coach';

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [localMessages, scrollToEnd]);

  const send = useCallback(async () => {
    const content = draft.trim();
    if (!content || !conversationId || streamMessage.isPending) return;

    const tempUserId = `local-user-${Date.now()}`;
    const tempAssistantId = `local-assistant-${Date.now()}`;

    setDraft('');
    setLocalMessages((prev) => [
      ...prev,
      { id: tempUserId, role: 'user', content },
      {
        id: tempAssistantId,
        role: 'assistant',
        content: '',
        streaming: true,
      },
    ]);

    try {
      await streamMessage.mutateAsync({
        conversationId,
        input: { content },
        onUserMessageId: (id) => {
          setLocalMessages((prev) =>
            prev.map((message) =>
              message.id === tempUserId ? { ...message, id } : message,
            ),
          );
        },
        onChunk: (text) => {
          setLocalMessages((prev) =>
            prev.map((message) =>
              message.id === tempAssistantId
                ? { ...message, content: text, streaming: true }
                : message,
            ),
          );
        },
      });

      setLocalMessages((prev) =>
        prev.map((message) =>
          message.id === tempAssistantId
            ? { ...message, streaming: false }
            : message,
        ),
      );
    } catch (err) {
      setLocalMessages((prev) =>
        prev.filter(
          (message) =>
            message.id !== tempUserId && message.id !== tempAssistantId,
        ),
      );
      setDraft(content);

      Alert.alert(
        isApiError(err) && err.isPaymentRequired
          ? 'Out of credits'
          : 'Send failed',
        isApiError(err)
          ? err.message
          : getErrorMessage(err, 'Couldn’t send that message.'),
      );
    }
  }, [conversationId, draft, streamMessage]);

  const keyExtractor = useCallback((item: ThreadMessage) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: ThreadMessage }) => (
      <MessageBubble
        role={item.role}
        content={item.content}
        streaming={item.streaming}
      />
    ),
    [],
  );

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
        {isLoading && localMessages.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Brand.accent} />
          </View>
        ) : null}

        {isError && localMessages.length === 0 ? (
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
            data={localMessages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.list,
              localMessages.length === 0 && styles.listEmpty,
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
                sending={streamMessage.isPending}
                disabled={isLoading && localMessages.length === 0}
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
