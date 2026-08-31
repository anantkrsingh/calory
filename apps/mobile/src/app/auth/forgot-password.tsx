import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api';
import { ThemedText } from '@/components/themed-text';
import CloseButton from '@/components/ui/CloseButton';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useForgotPassword } from '@/queries';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const forgotPassword = useForgotPassword();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setError(null);
  };

  const handleSubmit = async () => {
    const trimmed = email.trim();

    if (trimmed === '') {
      setError('Email is required');
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);

    try {
      await forgotPassword.mutateAsync({ email: trimmed.toLowerCase() });
      router.push({
        pathname: '/auth/reset-password',
        params: { email: trimmed.toLowerCase() },
      });
    } catch (cause) {
      setError(getErrorMessage(cause, 'Failed to send the reset code. Please try again.'));
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <CloseButton onPress={() => router.back()} accessibilityLabel="Back to sign in" />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={Spacing.four}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Forgot password?
          </ThemedText>
          <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Enter the email on your account and we&apos;ll send you a code to reset it.
          </ThemedText>
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="smallBold" style={styles.label}>
            Email Address
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundElement,
                color: theme.text,
                borderColor: error ? '#ff3b30' : theme.textSecondary,
              },
            ]}
            placeholder="Enter your registered email"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => {
              void handleSubmit();
            }}
          />
          {error ? <ThemedText type="small" style={styles.errorText}>{error}</ThemedText> : null}
        </View>

        <PrimaryButton
          label={forgotPassword.isPending ? 'Sending...' : 'Send Code'}
          onPress={() => {
            void handleSubmit();
          }}
          disabled={email.trim() === '' || forgotPassword.isPending}
          style={styles.submitButton}
        />

        <View style={styles.footer}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Remember your password?{' '}
          </ThemedText>
          <Pressable onPress={() => router.back()}>
            <ThemedText type="linkPrimary" style={styles.backLink}>
              Sign In
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: Spacing.five,
  },
  title: {
    textAlign: 'left',
    marginBottom: Spacing.two,
  },
  subtitle: {
    textAlign: 'left',
  },
  inputContainer: {
    width: '100%',
    marginBottom: Spacing.four,
  },
  label: {
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
  submitButton: {
    marginBottom: Spacing.three,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  backLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
