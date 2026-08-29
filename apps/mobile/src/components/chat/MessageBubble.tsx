import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

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
  const body = content.length > 0 ? content : streaming ? '…' : '';

  const markdownStyles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: theme.text,
          fontSize: 16,
          lineHeight: 22,
        },
        paragraph: {
          marginTop: 0,
          marginBottom: Spacing.two,
        },
        heading1: {
          color: theme.text,
          fontSize: 20,
          fontWeight: '700',
          marginBottom: Spacing.two,
          marginTop: Spacing.one,
        },
        heading2: {
          color: theme.text,
          fontSize: 18,
          fontWeight: '700',
          marginBottom: Spacing.two,
          marginTop: Spacing.one,
        },
        heading3: {
          color: theme.text,
          fontSize: 16,
          fontWeight: '700',
          marginBottom: Spacing.one,
          marginTop: Spacing.one,
        },
        strong: {
          fontWeight: '700',
          color: theme.text,
        },
        em: {
          fontStyle: 'italic',
        },
        link: {
          color: Brand.accent,
        },
        bullet_list: {
          marginBottom: Spacing.two,
        },
        ordered_list: {
          marginBottom: Spacing.two,
        },
        list_item: {
          marginBottom: Spacing.one,
        },
        bullet_list_icon: {
          color: theme.text,
          fontSize: 16,
          lineHeight: 22,
        },
        code_inline: {
          backgroundColor: theme.backgroundSelected,
          borderRadius: 4,
          color: theme.text,
          fontFamily: 'monospace',
          fontSize: 14,
          paddingHorizontal: 4,
          paddingVertical: 1,
        },
        fence: {
          backgroundColor: theme.backgroundSelected,
          borderColor: theme.border,
          borderRadius: 8,
          borderWidth: StyleSheet.hairlineWidth || 1,
          color: theme.text,
          fontFamily: 'monospace',
          fontSize: 13,
          marginBottom: Spacing.two,
          padding: Spacing.two,
        },
        code_block: {
          backgroundColor: theme.backgroundSelected,
          borderRadius: 8,
          color: theme.text,
          fontFamily: 'monospace',
          fontSize: 13,
          padding: Spacing.two,
        },
        blockquote: {
          backgroundColor: theme.background,
          borderColor: Brand.accent,
          borderLeftWidth: 3,
          marginBottom: Spacing.two,
          paddingHorizontal: Spacing.two,
          paddingVertical: Spacing.one,
        },
        hr: {
          backgroundColor: theme.border,
          height: StyleSheet.hairlineWidth || 1,
          marginVertical: Spacing.two,
        },
      }),
    [theme],
  );

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
        {isUser ? (
          <ThemedText style={[styles.text, { color: '#FFFFFF' }]}>
            {body}
          </ThemedText>
        ) : (
          <Markdown style={markdownStyles}>{body}</Markdown>
        )}
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
