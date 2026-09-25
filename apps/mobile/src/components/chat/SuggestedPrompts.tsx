import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SuggestedPrompt = {
  label: string;
  prompt: string;
};

export const DEFAULT_SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    label: 'Am i overweight?',
    prompt: 'Am i overweight?',
  },
  {
    label: 'Should i need to loose weight ?',
    prompt: 'Should i need to loose weight ?',
  },
  {
    label: 'Tell My Exercise History ?',
    prompt: 'Tell My Exercise History ?',
  },
  {
    label: 'How to buld shoulder',
    prompt: 'How to buld shoulder',
  },
];

type SuggestedPromptsProps = {
  prompts?: SuggestedPrompt[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
};

/** Tappable starter prompts shown when a chat has no messages yet, so a new
 * conversation isn't just a blank input waiting to be filled. */
export function SuggestedPrompts({
  prompts = DEFAULT_SUGGESTED_PROMPTS,
  onSelect,
  disabled,
}: SuggestedPromptsProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {prompts.map((item) => (
        <Pressable
          key={item.label}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          disabled={disabled}
          onPress={() => onSelect(item.prompt)}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: disabled ? 0.5 : pressed ? Pressed.opacity : 1,
            },
          ]}>
          <ThemedText style={styles.label}>{item.label}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'center',
  },
  chip: {
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth || 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
