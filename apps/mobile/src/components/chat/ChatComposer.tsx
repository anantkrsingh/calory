import { ArrowUp } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChatComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
};

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  disabled = false,
  sending = false,
  placeholder = 'Ask your coach…',
}: ChatComposerProps) {
  const theme = useTheme();
  const canSend = value.trim().length > 0 && !disabled && !sending;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        editable={!disabled}
        multiline
        maxLength={4000}
        style={[styles.input, { color: theme.text }]}
        onSubmitEditing={() => {
          if (canSend) onSend();
        }}
        blurOnSubmit={false}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={onSend}
        style={({ pressed }) => [
          styles.send,
          {
            backgroundColor: canSend ? Brand.accent : theme.backgroundSelected,
            opacity: pressed && canSend ? 0.85 : 1,
          },
        ]}>
        {sending ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <ArrowUp color="#FFFFFF" size={20} strokeWidth={2.5} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-end',
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth || 1,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    paddingVertical: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    minHeight: 40,
    paddingTop: 10,
    paddingBottom: 10,
  },
  send: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
