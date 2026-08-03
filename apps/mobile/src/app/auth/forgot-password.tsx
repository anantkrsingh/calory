import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { otpService } from '@/services/otp.service';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setError(null);
  };

  const validateEmail = (email: string): boolean => {
    if (email.trim() === '') {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await otpService.sendOTP(email.trim().toLowerCase(), 'password_reset');
      setSuccess(true);
    } catch {
      setError('Failed to send the reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setSuccess(false);
  };

  const handleBack = () => {
    router.push('/auth/login');
  };

  if (success) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}>
          <View style={styles.successContainer}>
            <View style={[styles.successIcon, { backgroundColor: '#28a745' }]}>
              <ThemedText type="title" style={{ color: 'white' }}>✓</ThemedText>
            </View>
            <ThemedText type="subtitle" style={styles.successTitle}>
              Reset code sent!
            </ThemedText>
            <ThemedText type="small" style={[styles.successText, { color: theme.textSecondary }]}>
              We&apos;ve sent a password reset code to {email}
            </ThemedText>
            <ThemedText type="small" style={[styles.successHint, { color: theme.textSecondary }]}>
              Check your inbox and follow the instructions to reset your password
            </ThemedText>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: '#208AEF' }]}
              onPress={handleResend}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                Send again
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: theme.backgroundElement }]}
              onPress={handleBack}>
              <ThemedText type="smallBold" style={styles.secondaryButtonText}>
                Back to Sign In
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <ThemedText type="title" style={styles.logoText}>
              Fit
            </ThemedText>
          </View>
          <ThemedText type="subtitle" style={styles.appName}>
            Forgot Password
          </ThemedText>
          <ThemedText type="small" style={[styles.tagline, { color: theme.textSecondary }]}>
            Enter your email to reset your password
          </ThemedText>
        </View>

        <View style={styles.formContainer}>
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
            />
            {error ? (
              <ThemedText type="small" style={styles.errorText}>{error}</ThemedText>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { 
                backgroundColor: email.trim() !== '' ? '#208AEF' : theme.backgroundElement,
                opacity: email.trim() !== '' ? 1 : 0.5,
              },
            ]}
            onPress={handleSubmit}
            disabled={email.trim() === '' || isLoading}>
            <ThemedText type="smallBold" style={styles.submitButtonText}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.footer}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Remember your password?{' '}
            </ThemedText>
            <TouchableOpacity onPress={handleBack}>
              <ThemedText type="linkPrimary" style={styles.backLink}>
                Sign In
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#208AEF',
    marginBottom: Spacing.two,
  },
  logoText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  appName: {
    marginBottom: Spacing.one,
  },
  tagline: {
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
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
    width: '100%',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
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
  successContainer: {
    alignItems: 'center',
    textAlign: 'center',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  successTitle: {
    marginBottom: Spacing.two,
  },
  successText: {
    marginBottom: Spacing.one,
  },
  successHint: {
    fontSize: 12,
    marginBottom: Spacing.four,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
