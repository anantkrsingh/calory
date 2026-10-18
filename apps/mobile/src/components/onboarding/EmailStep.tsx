import { useForm } from 'react-hook-form';
import { useFormField } from '@/hooks/use-form-field';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface EmailStepProps {
  email: string;
  onChange: (data: { email: string }) => void;
  optional?: boolean;
  /** Server-side error (e.g. failed to send the verification code), shown alongside field validation. */
  submitError?: string | null;
}

export default function EmailStep({
  email,
  onChange,
  optional = false,
  submitError,
}: EmailStepProps) {
  const theme = useTheme();
  const form = useForm<{
    input: string;
  }>({
    defaultValues: {
      input: email,
    },
  });
  const { clearErrors, trigger } = form;
  const [input, setInput] = useFormField(form, 'input', { validate: (value) => {
      if (!value.trim()) return optional || 'Email is required';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Please enter a valid email address';
    } });
  const error = form.formState.errors.input?.message;
  const displayedError = error ?? submitError;

  const handleChange = (text: string) => {
    setInput(text);
    clearErrors('input');
    onChange({ email: isValidEmail(text) ? text : '' });
  };

  const handleBlur = () => { void trigger('input'); };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        {optional ? 'Add an email?' : 'What\'s your email?'}
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        {optional
          ? 'You can add a verified email to your Apple account, or skip this for now.'
          : 'We\'ll use this to verify your account and send important updates'}
      </ThemedText>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              borderWidth: displayedError ? 1.5 : 0,
              borderColor: '#ff3b30',
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
        {displayedError && <ThemedText type="small" style={styles.errorText}>{displayedError}</ThemedText>}
      </View>

      <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
        {optional
          ? 'If you add one, we&apos;ll send a verification code before saving it.'
          : 'We&apos;ll send a verification code to this email'}
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
