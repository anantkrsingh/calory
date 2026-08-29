import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MessageSquare } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ConversationRowProps = {
  id: string;
  title: string;
  subtitle: string;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
};

function ConversationRowComponent({
  id,
  title,
  subtitle,
  onPress,
  onLongPress,
}: ConversationRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => onPress(id)}
      onLongPress={onLongPress ? () => onLongPress(id) : undefined}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        pressed && Pressed,
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.background }]}>
        <MessageSquare color={Brand.ink} size={20} />
      </View>
      <View style={styles.copy}>
        <ThemedText fontWeight="700" numberOfLines={1} style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText
          themeColor="textSecondary"
          numberOfLines={1}
          style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export const ConversationRow = memo(ConversationRowComponent);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth || 1,
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  iconWrap: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
