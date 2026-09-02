import type { ChatConversation } from '@fitness/types';
import { useRouter } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { getErrorMessage } from '@/api/errors';
import { ConversationRow } from '@/components/chat/ConversationRow';
import { ScreenAppBar } from '@/components/screen-app-bar';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useChats,
  useCreateChat,
  useDeleteChat,
} from '@/queries/chats.queries';
import {
  selectActiveConversationId,
  useChatSessionStore,
} from '@/stores/chat-session.store';

export default function ChatHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const activeId = useChatSessionStore(selectActiveConversationId);
  const setActiveId = useChatSessionStore((s) => s.setActiveConversationId);

  const { data, isLoading, isError, error, refetch, isRefetching } = useChats();
  const createChat = useCreateChat();
  const deleteChat = useDeleteChat();
  const conversations = data?.items ?? [];

  const selectConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      router.back();
    },
    [router, setActiveId],
  );

  const startNewChat = useCallback(async () => {
    try {
      const created = await createChat.mutateAsync({});
      setActiveId(created.id);
      router.back();
    } catch (err) {
      Alert.alert(
        'Couldn’t start chat',
        getErrorMessage(err, 'Something went wrong. Try again.'),
      );
    }
  }, [createChat, router, setActiveId]);

  const confirmDelete = useCallback(
    (id: string) => {
      Alert.alert(
        'Delete conversation?',
        'This removes the thread and all messages.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              void deleteChat.mutateAsync(id).then(() => {
                if (activeId === id) {
                  setActiveId(null);
                }
              }).catch((err) => {
                Alert.alert(
                  'Couldn’t delete',
                  getErrorMessage(err, 'Something went wrong.'),
                );
              });
            },
          },
        ],
      );
    },
    [activeId, deleteChat, setActiveId],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatConversation }) => (
      <ConversationRow
        conversation={item}
        selected={item.id === activeId}
        onPress={selectConversation}
        onLongPress={confirmDelete}
      />
    ),
    [activeId, confirmDelete, selectConversation],
  );

  const keyExtractor = useCallback((item: ChatConversation) => item.id, []);

  return (
    <TabScreen
      appBar={false}
      header={
        <ScreenAppBar
          title="History"
          left={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close history"
              hitSlop={8}
              onPress={() => router.back()}
              style={styles.iconButton}>
              <X color={theme.text} size={22} />
            </Pressable>
          }
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New chat"
              hitSlop={8}
              disabled={createChat.isPending}
              onPress={() => {
                void startNewChat();
              }}
              style={styles.iconButton}>
              {createChat.isPending ? (
                <ActivityIndicator color={Brand.accent} />
              ) : (
                <Plus color={theme.text} size={24} />
              )}
            </Pressable>
          }
        />
      }>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Brand.accent} />
        </View>
      ) : null}

      {isError ? (
        <View style={styles.centered}>
          <ThemedText fontWeight="700" style={styles.stateTitle}>
            Couldn’t load history
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.stateBody}>
            {getErrorMessage(error, 'Check your connection and try again.')}
          </ThemedText>
          <PrimaryButton
            label="Retry"
            onPress={() => void refetch()}
            style={styles.stateButton}
          />
        </View>
      ) : null}

      {!isLoading && !isError && conversations.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText fontWeight="700" style={styles.stateTitle}>
            No chats yet
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.stateBody}>
            Start a conversation with your coach and it will show up here.
          </ThemedText>
          <PrimaryButton
            label={createChat.isPending ? 'Starting…' : 'New chat'}
            disabled={createChat.isPending}
            onPress={() => {
              void startNewChat();
            }}
            style={styles.stateButton}
          />
        </View>
      ) : null}

      {!isLoading && !isError && conversations.length > 0 ? (
        <FlatList
          data={conversations}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={ListSeparator}
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
          }}
          showsVerticalScrollIndicator={false}
        />
      ) : null}
    </TabScreen>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  list: {
    paddingBottom: Spacing.five,
    paddingTop: Spacing.three,
  },
  separator: {
    height: Spacing.two,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.three,
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  stateBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  stateButton: {
    marginTop: Spacing.two,
  },
});
