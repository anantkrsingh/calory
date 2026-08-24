import { useFocusEffect, useRouter } from 'expo-router';
import { History, Plus } from 'lucide-react-native';
import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/errors';
import { ChatThread } from '@/components/chat/ChatThread';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useChats, useCreateChat } from '@/queries/chats.queries';
import {
  selectActiveConversationId,
  selectChatSessionHydrated,
  useChatSessionStore,
} from '@/stores/chat-session.store';

export default function ChatScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const hydrated = useChatSessionStore(selectChatSessionHydrated);
  const activeId = useChatSessionStore(selectActiveConversationId);
  const setActiveId = useChatSessionStore((s) => s.setActiveConversationId);

  const { data: chats, isLoading: listing } = useChats();
  const createChat = useCreateChat();
  const ensuringRef = useRef(false);

  // Ensure there is always an active conversation for the tab.
  useEffect(() => {
    if (!hydrated || ensuringRef.current) return;

    const items = chats?.items;
    if (activeId) return;
    if (listing && items === undefined) return;

    ensuringRef.current = true;
    void (async () => {
      try {
        const latest = items?.[0];
        if (latest) {
          setActiveId(latest.id);
          return;
        }
        const created = await createChat.mutateAsync({});
        setActiveId(created.id);
      } catch (err) {
        Alert.alert(
          'Couldn’t start chat',
          getErrorMessage(err, 'Something went wrong. Try again.'),
        );
      } finally {
        ensuringRef.current = false;
      }
    })();
  }, [
    activeId,
    chats?.items,
    createChat,
    hydrated,
    listing,
    setActiveId,
  ]);

  // Android back from chat goes to Home instead of exiting the app.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.navigate('/');
        return true;
      });
      return () => sub.remove();
    }, [router]),
  );

  const startNewChat = useCallback(async () => {
    try {
      const created = await createChat.mutateAsync({});
      setActiveId(created.id);
    } catch (err) {
      Alert.alert(
        'Couldn’t start chat',
        getErrorMessage(err, 'Something went wrong. Try again.'),
      );
    }
  }, [createChat, setActiveId]);

  return (
    <ThemedView style={styles.screen}>
      <View
        style={[
          styles.topBar,
          { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 8 : 0) },
        ]}>
        <View style={styles.topBarRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chat history"
            hitSlop={8}
            onPress={() => router.push('/chat/history')}
            style={[
              styles.pillButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            <History color={theme.text} size={20} strokeWidth={2.2} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New chat"
            hitSlop={8}
            disabled={createChat.isPending}
            onPress={() => {
              void startNewChat();
            }}
            style={[
              styles.pillButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            {createChat.isPending ? (
              <ActivityIndicator color={Brand.accent} />
            ) : (
              <Plus color={theme.text} size={22} strokeWidth={2.2} />
            )}
          </Pressable>
        </View>
      </View>

      {!activeId ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Brand.accent} />
          <ThemedText themeColor="textSecondary">Opening coach…</ThemedText>
        </View>
      ) : (
        <ChatThread key={activeId} conversationId={activeId} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: Spacing.three,
  },
  topBarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
  },
  pillButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth || 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.three,
    justifyContent: 'center',
  },
});
