import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import CloseButton from '@/components/ui/CloseButton';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { otpService } from '@/services/otp.service';
import { selectError, useOnboardingStore } from '@/stores/onboarding.store';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const formatSeconds = (total: number): string => {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const email = useOnboardingStore((state) => state.userData.email);
  const error = useOnboardingStore(selectError);
  const setLoading = useOnboardingStore((state) => state.setLoading);
  const setError = useOnboardingStore((state) => state.setError);
  const setVerified = useOnboardingStore((state) => state.setVerified);
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const otp = otpDigits.join('');
  const canResend = resendTimer === 0;

  const sendVerificationCode = useCallback(async () => {
    setLoading(true);
    setResendTimer(RESEND_SECONDS);

    try {
      await otpService.sendOTP(email, 'registration');
    } catch {
      setError('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  }, [email, setError, setLoading]);

  useEffect(() => {
    if (resendTimer === 0) return;

    const timer = setTimeout(() => setResendTimer((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  useEffect(() => {
    if (email) {
      sendVerificationCode();
    }
  }, [email, sendVerificationCode]);

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
      setError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await otpService.verifyOTP(email, otp, 'registration');

      if (isValid) {
        setVerified(true);
        router.push('/auth/create-password');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    await sendVerificationCode();
  };

  const handleClose = () => {
    resetOnboarding();
    router.dismissTo('/auth/welcome');
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <CloseButton onPress={handleClose} accessibilityLabel="Cancel sign up" />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={Spacing.four}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Verify your email
          </ThemedText>
          <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
            We&apos;ve sent a 6-digit verification code to
          </ThemedText>
          <ThemedText type="smallBold" style={styles.email}>
            {email}
          </ThemedText>
        </View>

        <View style={styles.otpContainer}>
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
                    borderColor: digit ? Brand.accent : theme.textSecondary,
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
        </View>

        {error ? (
          <ThemedText type="small" style={styles.errorText}>
            {error}
          </ThemedText>
        ) : null}

        <TouchableOpacity
          style={[
            styles.verifyButton,
            {
              backgroundColor: otp.length === OTP_LENGTH ? Brand.accent : theme.backgroundElement,
              opacity: otp.length === OTP_LENGTH ? 1 : 0.5,
            },
          ]}
          onPress={handleVerify}
          disabled={otp.length !== OTP_LENGTH || isVerifying}>
          <ThemedText type="smallBold" style={styles.verifyButtonText}>
            {isVerifying ? 'Verifying...' : 'Verify'}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <ThemedText type="small" style={[styles.resendText, { color: theme.textSecondary }]}>
            Didn&apos;t receive a code?{' '}
          </ThemedText>
          <TouchableOpacity onPress={handleResend} disabled={!canResend}>
            <ThemedText 
              type="linkPrimary" 
              style={[styles.resendLink, { opacity: canResend ? 1 : 0.5 }]}>
              Resend Code
            </ThemedText>
          </TouchableOpacity>
          {resendTimer > 0 ? (
            <ThemedText type="small" style={[styles.timer, { color: theme.textSecondary }]}>
              {formatSeconds(resendTimer)}
            </ThemedText>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.backgroundElement }]}
          onPress={() => router.back()}>
          <ThemedText type="smallBold" style={styles.backButtonText}>
            Back to sign up
          </ThemedText>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
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
    paddingBottom: Spacing.three,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  topBar: {
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
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
    marginBottom: Spacing.one,
  },
  email: {
    color: Brand.accent,
  },
  otpContainer: {
    width: '100%',
    alignItems: 'flex-start',
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
    borderRadius: 12,
    borderWidth: 1,
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
    width: '100%',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
  backButton: {
    width: '100%',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
