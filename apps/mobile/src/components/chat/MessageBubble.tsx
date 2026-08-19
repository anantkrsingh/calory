import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MessageBubbleProps = {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
};

function MessageBubbleComponent({
  role,
  content,
  streaming = false,
}: MessageBubbleProps) {
  const theme = useTheme();
  const isUser = role === 'user';

  return (
    <View
      style={[
        styles.row,
        isUser ? styles.rowUser : styles.rowAssistant,
      ]}>
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: Brand.ink }
            : {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: StyleSheet.hairlineWidth || 1,
              },
        ]}>
        <ThemedText
          style={[
            styles.text,
            { color: isUser ? '#FFFFFF' : theme.text },
          ]}>
          {content.length > 0 ? content : streaming ? '…' : ''}
        </ThemedText>
      </View>
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleComponent);

const styles = StyleSheet.create({
  row: {
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.four,
    width: '100%',
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderCurve: 'continuous',
    borderRadius: 18,
    maxWidth: '86%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
});
