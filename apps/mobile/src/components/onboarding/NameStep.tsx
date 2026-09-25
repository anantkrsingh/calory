import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface NameStepProps {
  displayName: string;
  onChange: (data: { displayName: string }) => void;
  optional?: boolean;
}

export default function NameStep({
  displayName,
  onChange,
  optional = false,
}: NameStepProps) {
  const theme = useTheme();
  const [input, setInput] = useState(displayName);
  const [error, setError] = useState<string | null>(null);

  const isValidName = (value: string): boolean => {
    const trimmed = value.trim();
    return trimmed.length >= 2 && trimmed.length <= 50;
  };

  const handleChange = (text: string) => {
    setInput(text);
    setError(null);
    onChange({ displayName: isValidName(text) ? text.trim() : '' });
  };

  const handleBlur = () => {
    if (input.trim() === '') {
      setError(optional ? null : 'Name is required');
    } else if (input.trim().length < 2) {
      setError('Name must be at least 2 characters');
    } else if (input.trim().length > 50) {
      setError('Name must be less than 50 characters');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        {optional ? 'Add your name?' : 'What should we call you?'}
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        {optional
          ? 'Apple may not share your name. You can add it now or skip it.'
          : 'This name will be displayed on your profile'}
      </ThemedText>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              borderWidth: error ? 1.5 : 0,
              borderColor: '#ff3b30',
            },
          ]}
          placeholder="Enter your full name"
          placeholderTextColor={theme.textSecondary}
          value={input}
          onChangeText={handleChange}
          onBlur={handleBlur}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
        />
        {error && <ThemedText type="small" style={styles.errorText}>{error}</ThemedText>}
      </View>

      <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
        {optional
          ? 'You can add this later in profile settings.'
          : 'You can change this later in your profile settings'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'stretch',
  },
  title: {
    textAlign: 'left',
    marginBottom: Spacing.one,
  },
  subtitle: {
    textAlign: 'left',
    marginBottom: Spacing.four,
  },
  inputContainer: {
    width: '100%',
    marginBottom: Spacing.two,
  },
  input: {
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 999,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: Spacing.one,
  },
  hint: {
    fontSize: 12,
    textAlign: 'left',
  },
});
