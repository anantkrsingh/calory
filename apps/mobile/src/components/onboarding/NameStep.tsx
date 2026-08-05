import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface NameStepProps {
  displayName: string;
  onChange: (data: { displayName: string }) => void;
}

export default function NameStep({ displayName, onChange }: NameStepProps) {
  const theme = useTheme();
  const [input, setInput] = useState(displayName);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (text: string) => {
    setInput(text);
    setError(null);
  };

  const handleBlur = () => {
    if (input.trim() === '') {
      setError('Name is required');
    } else if (input.trim().length < 2) {
      setError('Name must be at least 2 characters');
    } else if (input.trim().length > 50) {
      setError('Name must be less than 50 characters');
    } else {
      setError(null);
      onChange({ displayName: input.trim() });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        What should we call you?
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        This name will be displayed on your profile
      </ThemedText>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              borderColor: error ? '#ff3b30' : theme.textSecondary,
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
        You can change this later in your profile settings
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
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
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
