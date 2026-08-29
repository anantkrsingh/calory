import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { getErrorMessage, isApiError } from "@/api/errors";
import {
  ANDROID_TAB_BAR_HEIGHT,
  ANDROID_TAB_BAR_MARGIN_BOTTOM,
} from "@/components/android-tabbar/constants";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ThemedText } from "@/components/themed-text";
import { Brand, MaxContentWidth, Spacing } from "@/constants/theme";
import {
  isMessageStreaming,
  textFromUIMessage,
  toUIMessages,
} from "@/lib/chat-messages";
import { createCoachChatTransport } from "@/lib/chat-transport";
import { ChatsQueries, useChatDetail } from "@/queries/chats.queries";
import { LinearGradient } from "expo-linear-gradient";

type ChatThreadProps = {
  conversationId: string;
};

export function ChatThread({ conversationId }: ChatThreadProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useChatDetail(conversationId);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<UIMessage>>(null);
  const seededRef = useRef<string | null>(null);

  const transport = useMemo(
    () => createCoachChatTransport(conversationId),
    [conversationId],
  );

  const { messages, sendMessage, setMessages, status } = useChat({
    id: conversationId,
    // AI SDK react/ai package versions can drift in the monorepo; transport is compatible at runtime.
    transport: transport as never,
    onFinish: () => {
      void queryClient.invalidateQueries({ queryKey: ChatsQueries.keys.all });
      void queryClient.invalidateQueries({
        queryKey: ChatsQueries.keys.detail(conversationId),
      });
    },
    onError: (err) => {
      const message = getErrorMessage(err, "Couldn’t send that message.");
      const isCredits =
        /credit/i.test(message) || (isApiError(err) && err.isPaymentRequired);
      Alert.alert(isCredits ? "Out of credits" : "Send failed", message);
    },
  });

  useEffect(() => {
    if (!data) return;
    if (seededRef.current === conversationId) return;
    if (status !== "ready") return;

    seededRef.current = conversationId;
    setMessages(toUIMessages(data.messages) as never);
  }, [conversationId, data, setMessages, status]);

  const sending = status === "submitted" || status === "streaming";

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
    if (!content || sending) return;

    setDraft("");
    await sendMessage({ text: content });
  }, [draft, sendMessage, sending]);

  const keyExtractor = useCallback((item: UIMessage) => item.id, []);

  const renderItem = useCallback(({ item }: { item: UIMessage }) => {
    if (item.role !== "user" && item.role !== "assistant") return null;
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

  const composerBarSpacing = {
    paddingBottom: Spacing.two,
  };

  const stickyOffset =
    Platform.OS === "android"
      ? {
          closed: -(
            insets.bottom +
            ANDROID_TAB_BAR_HEIGHT +
            ANDROID_TAB_BAR_MARGIN_BOTTOM
          ),
          opened: 0,
        }
      : { closed: -insets.bottom, opened: 0 };

  const composerContent = (
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
  );

  return (
    <View style={styles.flex}>
      {isLoading && messages.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Brand.accent} />
        </View>
      ) : null}

      {isError && messages.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText style={styles.errorTitle}>Couldn’t open chat</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.errorBody}>
            {isApiError(error)
              ? error.message
              : getErrorMessage(error, "Try again in a moment.")}
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
            { paddingBottom: Platform.OS === "android" ? Spacing.two : 400 },
          ]}
          ListEmptyComponent={listEmpty}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}
        />
      )}

      <KeyboardStickyView offset={stickyOffset}>
        <View style={[styles.composerBar, composerBarSpacing]}>
          {composerContent}
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gradientBackground: {},
  list: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  emptyTitle: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  composerBar: {
    overflow: "hidden",
    paddingTop: Spacing.two,
  },
  composerInner: {
    alignSelf: "center",
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    width: "100%",
  },
  centered: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.two,
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  errorBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
