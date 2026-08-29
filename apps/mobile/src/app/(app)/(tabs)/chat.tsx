import type { ChatConversation } from '@fitness/types';
import { useRouter, type Href } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { getErrorMessage, isApiError } from '@/api/errors';
import { ConversationRow } from '@/components/chat/ConversationRow';
import { ScreenAppBar } from '@/components/screen-app-bar';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useChats,
  useCreateChat,
  useDeleteChat,
} from '@/queries/chats.queries';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function chatHref(id: string): Href {
  return `/chat/${id}` as Href;
}

function subtitleFor(conversation: ChatConversation): string {
  if (conversation.lastMessageAt) {
    return dateFormatter.format(new Date(conversation.lastMessageAt));
  }
  return 'New conversation';
}

export default function ChatScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useChats();
  const createChat = useCreateChat();
  const deleteChat = useDeleteChat();

  const conversations = data?.items ?? [];

  const openConversation = useCallback(
    (id: string) => {
      router.push(chatHref(id));
    },
    [router],
  );

  const startChat = useCallback(async () => {
    try {
      const conversation = await createChat.mutateAsync({});
      router.push(chatHref(conversation.id));
    } catch (err) {
      Alert.alert(
        'Couldn’t start chat',
        getErrorMessage(err, 'Something went wrong. Try again.'),
      );
    }
  }, [createChat, router]);

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
              void deleteChat.mutateAsync(id).catch((err) => {
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
    [deleteChat],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatConversation }) => (
      <ConversationRow
        id={item.id}
        title={item.title?.trim() || 'New chat'}
        subtitle={subtitleFor(item)}
        onPress={openConversation}
        onLongPress={confirmDelete}
      />
    ),
    [confirmDelete, openConversation],
  );

  const keyExtractor = useCallback((item: ChatConversation) => item.id, []);

  return (
    <TabScreen
      appBar={false}
      header={
        <ScreenAppBar
          title="Chat"
          showBack={false}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New chat"
              hitSlop={8}
              disabled={createChat.isPending}
              onPress={() => {
                void startChat();
              }}
              style={styles.newButton}>
              {createChat.isPending ? (
                <ActivityIndicator color={Brand.accent} />
              ) : (
                <Plus color={theme.text} size={24} />
              )}
            </Pressable>
          }
        />
      }
      contentStyle={styles.content}>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Brand.accent} />
        </View>
      ) : null}

      {isError ? (
        <View style={styles.centered}>
          <ThemedText style={styles.errorTitle}>Couldn’t load chats</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.errorBody}>
            {isApiError(error)
              ? error.message
              : getErrorMessage(error, 'Check your connection and try again.')}
          </ThemedText>
          <PrimaryButton label="Retry" onPress={() => void refetch()} />
        </View>
      ) : null}

      {!isLoading && !isError && conversations.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText fontWeight="700" style={styles.emptyTitle}>
            Ask your coach
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
            Form tips, recovery, nutrition basics — start a chat anytime.
          </ThemedText>
          <PrimaryButton
            label={createChat.isPending ? 'Starting…' : 'New chat'}
            disabled={createChat.isPending}
            onPress={() => {
              void startChat();
            }}
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
  content: {
    paddingHorizontal: 0,
  },
  newButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  list: {
    paddingBottom: BottomTabInset + Spacing.four,
    paddingHorizontal: Spacing.four,
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
    paddingHorizontal: Spacing.four,
  },
  emptyTitle: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.two,
    textAlign: 'center',
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
