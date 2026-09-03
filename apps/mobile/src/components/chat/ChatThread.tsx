import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { ChevronDown, RotateCw } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { getChatErrorMessage, getErrorMessage } from "@/api/errors";
import {
  ANDROID_TAB_BAR_HEIGHT,
  ANDROID_TAB_BAR_MARGIN_BOTTOM,
} from "@/components/android-tabbar/constants";
import { BotAvatar } from "@/components/chat/BotAvatar";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { QuestionCard } from "@/components/chat/QuestionCard";
import { SuggestedPrompts } from "@/components/chat/SuggestedPrompts";
import { ThinkingIndicator } from "@/components/chat/ThinkingIndicator";
import { ThemedText } from "@/components/themed-text";
import { Brand, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  askQuestionFromUIMessage,
  isMessageStreaming,
  pendingToolLabel,
  textFromUIMessage,
  toUIMessages,
} from "@/lib/chat-messages";
import { createCoachChatTransport } from "@/lib/chat-transport";
import { ChatsQueries, useChatDetail } from "@/queries/chats.queries";

type ChatThreadProps = {
  conversationId: string;
};

const SCROLL_BOTTOM_THRESHOLD = 120;

// Module scope, not inline in the component — `Date.now()` is an impure
// call the React Compiler lint rule rejects directly inside a component/hook
// body (see react-hooks/purity), even though this only ever runs from the
// `onError` event callback, never during render.
let errorMessageSeq = 0;
function nextErrorMessageId(): string {
  errorMessageSeq += 1;
  return `error-${Date.now()}-${errorMessageSeq}`;
}

export function ChatThread({ conversationId }: ChatThreadProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useChatDetail(conversationId);
  const [draft, setDraft] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const listRef = useRef<FlatList<UIMessage>>(null);
  const seededRef = useRef<string | null>(null);
  // The text behind each synthetic error bubble (keyed by its message id),
  // so the Retry button can resend exactly what failed.
  const lastSentTextRef = useRef("");
  const [failedSends, setFailedSends] = useState<Record<string, string>>({});

  const transport = useMemo(
    () => createCoachChatTransport(conversationId),
    [conversationId],
  );

  const { messages, sendMessage, setMessages, status } = useChat({
    id: conversationId,
    transport: transport as never,
    onFinish: () => {
      void queryClient.invalidateQueries({ queryKey: ChatsQueries.keys.all });
      void queryClient.invalidateQueries({
        queryKey: ChatsQueries.keys.detail(conversationId),
      });
    },
    // Surface a send failure as the coach's own reply instead of a dialog —
    // `getChatErrorMessage` unwraps the raw ApiErrorBody JSON the transport
    // throws (see its doc comment) down to just the message sentence.
    onError: (err) => {
      const message = getChatErrorMessage(
        err,
        "Couldn’t send that message. Try again in a moment.",
      );
      const id = nextErrorMessageId();
      const parts: UIMessage["parts"] = [{ type: "text", text: message }];
      setMessages((prev) => [...prev, { id, role: "assistant", parts }]);
      if (lastSentTextRef.current) {
        setFailedSends((prev) => ({ ...prev, [id]: lastSentTextRef.current }));
      }
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

  const lastMessage = messages.length ? messages[messages.length - 1] : null;
  const lastAssistantText =
    lastMessage?.role === "assistant" ? textFromUIMessage(lastMessage) : "";
  const lastAssistantQuestion =
    lastMessage?.role === "assistant"
      ? askQuestionFromUIMessage(lastMessage)
      : null;
  const showThinking =
    (status === "submitted" || status === "streaming") &&
    !lastAssistantQuestion &&
    (lastMessage?.role !== "assistant" || lastAssistantText.length === 0);
  const thinkingLabel =
    (lastMessage?.role === "assistant" && pendingToolLabel(lastMessage)) ||
    "Thinking…";

  const scrollToEnd = useCallback((animated = false) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - contentOffset.y - layoutMeasurement.height;
      setIsAtBottom(distanceFromBottom < SCROLL_BOTTOM_THRESHOLD);
    },
    [],
  );

  useEffect(() => {
    if (isAtBottom) scrollToEnd();
  }, [messages, scrollToEnd, showThinking, isAtBottom]);

  const send = useCallback(async () => {
    const content = draft.trim();
    if (!content || sending) return;

    setDraft("");
    setIsAtBottom(true);
    scrollToEnd(true);
    lastSentTextRef.current = content;
    await sendMessage({ text: content });
  }, [draft, scrollToEnd, sendMessage, sending]);

  const answerQuestion = useCallback(
    (selected: string[]) => {
      if (sending || selected.length === 0) return;
      setIsAtBottom(true);
      scrollToEnd(true);
      lastSentTextRef.current = selected.join(", ");
      void sendMessage({ text: lastSentTextRef.current });
    },
    [scrollToEnd, sendMessage, sending],
  );

  const sendSuggestion = useCallback(
    (prompt: string) => {
      if (sending) return;
      setDraft("");
      setIsAtBottom(true);
      scrollToEnd(true);
      lastSentTextRef.current = prompt;
      void sendMessage({ text: prompt });
    },
    [scrollToEnd, sendMessage, sending],
  );

  /** Resends the exact text behind a failed send, and clears its error bubble. */
  const retry = useCallback(
    (errorMessageId: string) => {
      const text = failedSends[errorMessageId];
      if (!text || sending) return;

      setFailedSends((prev) => {
        const next = { ...prev };
        delete next[errorMessageId];
        return next;
      });
      setMessages((prev) => prev.filter((m) => m.id !== errorMessageId));
      setIsAtBottom(true);
      scrollToEnd(true);
      lastSentTextRef.current = text;
      void sendMessage({ text });
    },
    [failedSends, scrollToEnd, sendMessage, sending, setMessages],
  );

  const lastMessageId = messages.length
    ? messages[messages.length - 1].id
    : null;

  const keyExtractor = useCallback((item: UIMessage) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }: { item: UIMessage; index: number }) => {
      if (item.role === "user") {
        return (
          <MessageBubble role="user" content={textFromUIMessage(item)} />
        );
      }
      if (item.role !== "assistant") return null;

      const question = askQuestionFromUIMessage(item);
      const text = textFromUIMessage(item);

      if (question) {
        const next = messages[index + 1];
        const nextText =
          next?.role === "user" ? textFromUIMessage(next).trim() : "";
        const tokens = nextText
          ? nextText.split(",").map((token) => token.trim())
          : [];
        const chosen = question.options.filter((option: string) =>
          tokens.includes(option),
        );

        return (
          <View style={styles.row}>
            <View style={styles.assistantRow}>
              <BotAvatar size={22} />
              <View style={styles.assistantBody}>
                {text ? (
                  <ThemedText style={styles.leadText}>{text}</ThemedText>
                ) : null}
                <QuestionCard
                  question={question}
                  interactive={item.id === lastMessageId && status === "ready"}
                  chosen={chosen}
                  onSubmit={answerQuestion}
                />
              </View>
            </View>
          </View>
        );
      }

      if (!text) return null;

      const retryText = failedSends[item.id];
      if (retryText) {
        return (
          <View style={styles.row}>
            <View style={styles.assistantRow}>
              <BotAvatar size={22} />
              <View style={styles.assistantBody}>
                <ThemedText style={styles.leadText}>{text}</ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry sending"
                  disabled={sending}
                  onPress={() => retry(item.id)}
                  style={({ pressed }) => [
                    styles.retryButton,
                    { opacity: sending ? 0.5 : pressed ? 0.85 : 1 },
                  ]}>
                  <RotateCw color={Brand.accent} size={14} strokeWidth={2.4} />
                  <ThemedText style={styles.retryText}>Retry</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        );
      }

      return (
        <MessageBubble
          role="assistant"
          content={text}
          streaming={isMessageStreaming(item)}
        />
      );
    },
    [answerQuestion, failedSends, lastMessageId, messages, retry, sending, status],
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
        <SuggestedPrompts onSelect={sendSuggestion} disabled={sending} />
      </View>
    );
  }, [isLoading, sendSuggestion, sending]);

  const bottomClearance =
    Platform.OS === "android"
      ? insets.bottom + ANDROID_TAB_BAR_HEIGHT + ANDROID_TAB_BAR_MARGIN_BOTTOM
      : insets.bottom;

  const composerBarSpacing = {
    paddingBottom: Spacing.two + bottomClearance,
  };

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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={-bottomClearance}>
      {isLoading && messages.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Brand.accent} />
        </View>
      ) : null}

      {isError && messages.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText style={styles.errorTitle}>Couldn’t open chat</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.errorBody}>
            {getErrorMessage(error, "Try again in a moment.")}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.listWrap}>
          <FlatList
            ref={listRef}
            style={styles.flatList}
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.list,
              messages.length === 0 && styles.listEmpty,
            ]}
            ListEmptyComponent={listEmpty}
            ListFooterComponent={
              showThinking ? <ThinkingIndicator label={thinkingLabel} /> : null
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={handleScroll}
            scrollEventThrottle={100}
            onContentSizeChange={() => {
              if (isAtBottom) scrollToEnd();
            }}
          />

          {!isAtBottom && messages.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scroll to latest message"
              onPress={() => {
                setIsAtBottom(true);
                scrollToEnd(true);
              }}
              style={({ pressed }) => [
                styles.scrollDownButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <ChevronDown color={theme.text} size={20} strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </View>
      )}

      <View style={[styles.composerBar, composerBarSpacing]}>
        {composerContent}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  listWrap: {
    flex: 1,
  },
  scrollDownButton: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth || 1,
    bottom: Spacing.three,
    elevation: 4,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: Spacing.four,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    width: 40,
  },
  list: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  row: {
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.four,
    width: "100%",
  },
  assistantRow: {
    flexDirection: "row",
    gap: Spacing.two,
    maxWidth: "100%",
  },
  assistantBody: {
    flex: 1,
    gap: Spacing.two,
    paddingTop: 2,
  },
  leadText: {
    fontSize: 16,
    lineHeight: 22,
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: Brand.accent,
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth || 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
  },
  retryText: {
    color: Brand.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    alignSelf: "center",
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.five,
    width: "100%",
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
