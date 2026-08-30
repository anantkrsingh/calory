import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { BotAvatar } from '@/components/chat/BotAvatar';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const USER_BUBBLE_BG = Brand.accent;
const USER_BUBBLE_RADIUS = 20;

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
        <View style={styles.bubbleWrap}>
          <View
            style={[
              styles.bubble,
              styles.userBubble,
              { backgroundColor: USER_BUBBLE_BG },
            ]}>
            <ThemedText style={[styles.text, styles.userText]}>
              {body}
            </ThemedText>
          </View>
          <View style={styles.rightArrow} />
          <View
            style={[
              styles.rightArrowOverlap,
              { backgroundColor: theme.background },
            ]}
          />
        </View>
      </View>
    );
  }

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
  userBubble: {
    borderRadius: USER_BUBBLE_RADIUS,
  },
  bubbleWrap: {
    alignSelf: 'flex-end',
  },
  tail: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
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
  rightArrow:{
    position: 'absolute',
    backgroundColor:USER_BUBBLE_BG,
    width: 18,
    height: 20,
    bottom: -2,
    right: -5,
    borderBottomLeftRadius: 25,
  },
  rightArrowOverlap:{
    position: 'absolute',
    width:20,
    height:35,
    bottom:-6,
    right:-20,
    borderBottomLeftRadius:18
  },
});
