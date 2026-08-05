import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface EmailStepProps {
  email: string;
  onChange: (data: { email: string }) => void;
}

export default function EmailStep({ email, onChange }: EmailStepProps) {
  const theme = useTheme();
  const [input, setInput] = useState(email);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (text: string) => {
    setInput(text);
    setError(null);
    onChange({ email: isValidEmail(text) ? text : '' });
  };

  const handleBlur = () => {
    if (input.trim() === '') {
      setError('Email is required');
    } else if (!isValidEmail(input)) {
      setError('Please enter a valid email address');
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        What's your email?
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        We'll use this to verify your account and send important updates
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
          placeholder="Enter your email"
          placeholderTextColor={theme.textSecondary}
          value={input}
          onChangeText={handleChange}
          onBlur={handleBlur}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        {error && <ThemedText type="small" style={styles.errorText}>{error}</ThemedText>}
      </View>

      <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
        We'll send a verification code to this email
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
