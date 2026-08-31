import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useRouter } from 'expo-router';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { getErrorMessage } from '@/api';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useResendOtp, useVerifyRegistration } from '@/queries';
import { useOnboardingStore } from '@/stores/onboarding.store';

export type VerifyEmailSheetRef = {
  present: () => void;
};

const HANDLE_COLOR = 'rgba(120, 120, 128, 0.3)';
const OTP_LENGTH = 4;
const RESEND_SECONDS = 60;

const formatSeconds = (total: number): string => {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default forwardRef<VerifyEmailSheetRef>(function VerifyEmailSheet(_props, ref) {
  const theme = useTheme();
  const router = useRouter();
  const sheetRef = useRef<TrueSheet>(null);
  const email = useOnboardingStore((state) => state.userData.email);
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const resendOtp = useResendOtp();
  const verifyRegistration = useVerifyRegistration();

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(TextInput | null)[]>([]);

  const otp = otpDigits.join('');
  const canResend = resendTimer === 0;

  const sendVerificationCode = useCallback(async () => {
    setResendTimer(RESEND_SECONDS);

    try {
      await resendOtp.mutateAsync({ email });
    } catch (cause) {
      setError(getErrorMessage(cause, 'Failed to send verification code'));
    }
  }, [email, resendOtp]);

  useEffect(() => {
    if (resendTimer === 0) return;

    const timer = setTimeout(() => setResendTimer((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  useImperativeHandle(ref, () => ({
    present: () => {
      // The code was already sent by register — just reset UI state.
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setError(null);
      setResendTimer(RESEND_SECONDS);
      sheetRef.current?.present();
    },
  }));

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

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) {
      setError('Please enter a 4-digit code');
      return;
    }

    setError(null);

    try {
      await verifyRegistration.mutateAsync({ email, code: otp });
      await sheetRef.current?.dismiss();
      resetOnboarding();
      router.replace('/');
    } catch (cause) {
      setError(getErrorMessage(cause, 'Verification failed. Please try again.'));
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    await sendVerificationCode();
  };

  return (
    <TrueSheet
      ref={sheetRef}
      detents={['auto']}
      dimmed
      dimmedDetentIndex={0}
      backgroundColor="transparent"
      cornerRadius={0}
      grabber={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.sheetPadding}>
            <View style={[styles.card, { backgroundColor: theme.background }]}>
              <View style={styles.handle} />

              <ThemedText type="subtitle" style={styles.title}>
                Verify your email
              </ThemedText>
              <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
                We&apos;ve sent a 4-digit verification code to
              </ThemedText>
              <ThemedText type="smallBold" style={styles.email}>
                {email}
              </ThemedText>

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

              {error ? (
                <ThemedText type="small" style={styles.errorText}>
                  {error}
                </ThemedText>
              ) : null}

              <PrimaryButton
                label={verifyRegistration.isPending ? 'Verifying...' : 'Verify'}
                onPress={handleVerify}
                disabled={otp.length !== OTP_LENGTH || verifyRegistration.isPending}
                style={styles.verifyButton}
              />

              <View style={styles.resendContainer}>
                <ThemedText type="small" style={[styles.resendText, { color: theme.textSecondary }]}>
                  Didn&apos;t receive a code?{' '}
                </ThemedText>
                <Pressable
                  onPress={handleResend}
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
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  sheetPadding: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  card: {
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: Spacing.four,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: HANDLE_COLOR,
    marginBottom: Spacing.three,
  },
  title: {
    textAlign: 'left',
    marginBottom: Spacing.one,
  },
  subtitle: {
    textAlign: 'left',
    marginBottom: Spacing.one,
  },
  email: {
    color: Brand.accent,
    marginBottom: Spacing.four,
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
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: Spacing.three,
    textAlign: 'left',
  },
  verifyButton: {
    marginBottom: Spacing.three,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: Spacing.one,
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
});
