import type { ChatConversation } from '@fitness/types';
import { Check, ChevronRight, MessageSquare } from 'lucide-react-native';
import { memo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HAIRLINE = StyleSheet.hairlineWidth || 1;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

function formatWhen(iso?: string): string {
  if (!iso) return 'Just created';
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  return sameDay ? timeFormatter.format(date) : dateFormatter.format(date);
}

type ConversationRowProps = {
  conversation: ChatConversation;
  selected?: boolean;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
};

function ConversationRowComponent({
  conversation,
  selected = false,
  onPress,
  onLongPress,
}: ConversationRowProps) {
  const theme = useTheme();
  const title = conversation.title?.trim() || 'New chat';
  const when = formatWhen(conversation.lastMessageAt ?? conversation.createdAt);
  const count = conversation.messageCount;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected }}
      onPress={() => onPress(conversation.id)}
      onLongPress={
        onLongPress ? () => onLongPress(conversation.id) : undefined
      }
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.surface,
          borderColor: theme.border,
        },
        pressed && Pressed,
      ]}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: selected
              ? 'rgba(239, 90, 36, 0.12)'
              : theme.background,
          },
        ]}>
        <MessageSquare
          color={selected ? Brand.accent : Brand.ink}
          size={18}
          strokeWidth={2.2}
        />
      </View>

      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <ThemedText fontWeight="700" numberOfLines={1} style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.when}>
            {when}
          </ThemedText>
        </View>
        <ThemedText
          themeColor="textSecondary"
          numberOfLines={1}
          style={styles.meta}>
          {count === 0
            ? 'No messages yet'
            : `${count} message${count === 1 ? '' : 's'}`}
        </ThemedText>
      </View>

      {selected ? (
        <View style={styles.checkBadge}>
          <Check color="#FFFFFF" size={13} strokeWidth={3} />
        </View>
      ) : (
        <ChevronRight color={theme.textSecondary} size={18} />
      )}
    </Pressable>
  );
}

export const ConversationRow = memo(ConversationRowComponent);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: HAIRLINE,
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      default: {},
    }),
  },
  iconWrap: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  checkBadge: {
    alignItems: 'center',
    backgroundColor: Brand.accent,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  copy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  when: {
    fontSize: 12,
    lineHeight: 16,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
});
