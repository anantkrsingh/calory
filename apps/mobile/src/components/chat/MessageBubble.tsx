import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { BotAvatar } from '@/components/chat/BotAvatar';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Accent-tinted surface, matching the highlight treatment used elsewhere
// (e.g. exercise badges) instead of a flat, always-dark bubble.
const USER_BUBBLE_BG = 'rgba(239, 90, 36, 0.12)';
const USER_BUBBLE_BORDER = 'rgba(239, 90, 36, 0.24)';

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
  const body = content;

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

  if (isUser) {
    return (
      <View style={[styles.row, styles.rowUser]}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: USER_BUBBLE_BG,
              borderColor: USER_BUBBLE_BORDER,
              borderWidth: StyleSheet.hairlineWidth || 1,
            },
          ]}>
          <ThemedText style={styles.text}>{body}</ThemedText>
        </View>
      </View>
    );
  }

  // Plain, card-free assistant response — just the coach avatar and text,
  // consistent with the rest of the app's response-first chat style.
  return (
    <View style={[styles.row, styles.rowAssistant]}>
      <View style={styles.assistantRow}>
        <BotAvatar active={streaming} size={22} />
        <View style={styles.assistantBody}>
          <Markdown style={markdownStyles}>{body}</Markdown>
        </View>
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
  assistantRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    maxWidth: '100%',
  },
  assistantBody: {
    flex: 1,
    paddingTop: 2,
  },
});
