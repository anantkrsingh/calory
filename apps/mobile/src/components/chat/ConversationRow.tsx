import type { ChatConversation } from '@fitness/types';
import { Check, ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ChatIcon } from '@/components/ui/ChatIcon';
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
      <View style={styles.iconWrap}>
        <ChatIcon
          color={selected ? Brand.accent : theme.text}
          size={26}
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
    borderRadius: 999,
    borderWidth: HAIRLINE,
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
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
    justifyContent: 'center',
    width: 28,
    height: 28,
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
});
