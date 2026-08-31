import { AUTH } from '@fitness/config';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api';
import { ThemedText } from '@/components/themed-text';
import CloseButton from '@/components/ui/CloseButton';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useForgotPassword, useResetPassword } from '@/queries';

const OTP_LENGTH = 4;
const RESEND_SECONDS = 60;

const formatSeconds = (total: number): string => {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const validatePassword = (pwd: string): string => {
  if (pwd.length < AUTH.minPasswordLength) {
    return `Password must be at least ${AUTH.minPasswordLength} characters`;
  }
  if (pwd.length > AUTH.maxPasswordLength) {
    return `Password must be less than ${AUTH.maxPasswordLength} characters`;
  }
  if (!/[a-z]/.test(pwd)) return 'Password must contain a lowercase letter';
  if (!/[A-Z]/.test(pwd)) return 'Password must contain an uppercase letter';
  if (!/[0-9]/.test(pwd)) return 'Password must contain a number';
  return '';
};

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  const forgotPassword = useForgotPassword();
  const resetPassword = useResetPassword();

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const inputs = useRef<(TextInput | null)[]>([]);

  const otp = otpDigits.join('');
  const canResend = resendTimer === 0;

  useEffect(() => {
    if (!email) {
      router.replace('/auth/forgot-password');
    }
  }, [email, router]);

  useEffect(() => {
    if (resendTimer === 0) return;
    const timer = setTimeout(() => setResendTimer((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleDigitChange = (index: number, text: string) => {
    const digits = text.replace(/\D/g, '');

    if (digits.length > 1) {
      const next = Array(OTP_LENGTH).fill('');
      digits
        .slice(0, OTP_LENGTH)
        .split('')
        .forEach((digit, position) => {
          next[position] = digit;
        });
      setOtpDigits(next);
      inputs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = digits;
    setOtpDigits(next);

    if (digits && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    setResendTimer(RESEND_SECONDS);
    setError(null);
    try {
      await forgotPassword.mutateAsync({ email });
    } catch (cause) {
      setError(getErrorMessage(cause, 'Failed to resend the code. Please try again.'));
    }
  };

  const handleSubmit = async () => {
    if (!email) return;

    if (otp.length !== OTP_LENGTH) {
      setError('Please enter the 4-digit code');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);

    try {
      await resetPassword.mutateAsync({ email, code: otp, password });
      Alert.alert('Reset password successful', 'Please login again', [
        { text: 'OK', onPress: () => router.dismissTo('/auth/welcome') },
      ]);
    } catch (cause) {
      setError(getErrorMessage(cause, 'Could not reset your password. Please try again.'));
    }
  };

  const canSubmit =
    otp.length === OTP_LENGTH && password !== '' && confirmPassword !== '' && !resetPassword.isPending;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <CloseButton onPress={() => router.back()} accessibilityLabel="Back" />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={Spacing.four}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Reset password
          </ThemedText>
          <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Enter the 4-digit code we sent to
          </ThemedText>
          <ThemedText type="smallBold" style={{ color: Brand.accent }}>
            {email}
          </ThemedText>
        </View>

        <View style={styles.otpInputs}>
          {otpDigits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(input) => {
                inputs.current[index] = input;
              }}
              style={[
                styles.otpInput,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                  borderColor: digit ? Brand.accent : 'transparent',
                },
              ]}
              value={digit}
              onChangeText={(text) => handleDigitChange(index, text)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              keyboardType="numeric"
              maxLength={OTP_LENGTH}
              textAlign="center"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="oneTimeCode"
            />
          ))}
        </View>

        <View style={styles.resendContainer}>
          <ThemedText type="small" style={[styles.resendText, { color: theme.textSecondary }]}>
            Didn&apos;t receive a code?{' '}
          </ThemedText>
          <Pressable
            onPress={() => {
              void handleResend();
            }}
            disabled={!canResend}
            style={({ pressed }) => [pressed && canResend && Pressed]}>
            <ThemedText
              type="linkPrimary"
              style={[styles.resendLink, { opacity: canResend ? 1 : 0.5 }]}>
              Resend Code
            </ThemedText>
          </Pressable>
          {resendTimer > 0 ? (
            <ThemedText type="small" style={[styles.timer, { color: theme.textSecondary }]}>
              {formatSeconds(resendTimer)}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="smallBold" style={styles.label}>
            New Password
          </ThemedText>
          <View style={styles.passwordInputWrapper}>
            <TextInput
              style={[
                styles.passwordInput,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                  borderColor: theme.textSecondary,
                },
              ]}
              placeholder="Enter your new password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <Pressable
              style={({ pressed }) => [
                styles.eyeIcon,
                pressed && {
                  opacity: Pressed.opacity,
                  transform: [{ translateY: -12 }, { scale: 0.99 }],
                },
              ]}
              onPress={() => setShowPassword(!showPassword)}>
              <ThemedText type="default" style={styles.eyeIconText}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="smallBold" style={styles.label}>
            Confirm Password
          </ThemedText>
          <View style={styles.passwordInputWrapper}>
            <TextInput
              style={[
                styles.passwordInput,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                  borderColor: theme.textSecondary,
                },
              ]}
              placeholder="Confirm your new password"
              placeholderTextColor={theme.textSecondary}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError(null);
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => {
                void handleSubmit();
              }}
            />
            <Pressable
              style={({ pressed }) => [
                styles.eyeIcon,
                pressed && {
                  opacity: Pressed.opacity,
                  transform: [{ translateY: -12 }, { scale: 0.99 }],
                },
              ]}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <ThemedText type="default" style={styles.eyeIconText}>
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {error ? <ThemedText type="small" style={styles.errorText}>{error}</ThemedText> : null}

        <PrimaryButton
          label={resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
          onPress={() => {
            void handleSubmit();
          }}
          disabled={!canSubmit}
          style={styles.submitButton}
        />
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
    marginBottom: Spacing.four,
  },
  title: {
    textAlign: 'left',
    marginBottom: Spacing.two,
  },
  subtitle: {
    textAlign: 'left',
    marginBottom: Spacing.one,
  },
  otpInputs: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginBottom: Spacing.four,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  timer: {
    fontSize: 12,
  },
  inputContainer: {
    width: '100%',
    marginBottom: Spacing.three,
  },
  label: {
    marginBottom: Spacing.two,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    paddingRight: 50,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  eyeIconText: {
    fontSize: 16,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 13,
    marginBottom: Spacing.two,
  },
  submitButton: {
    marginBottom: Spacing.three,
  },
});
