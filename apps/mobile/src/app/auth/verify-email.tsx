import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { otpService } from '@/services/otp.service';

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { userData, setLoading, setError, setVerified, updateUserData } = useOnboardingStore();
  const [otp, setOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);

  // Start resend timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Send OTP on mount
  useEffect(() => {
    if (userData.email) {
      sendVerificationCode();
    }
  }, []);

  const sendVerificationCode = async () => {
    setLoading(true);
    setCanResend(false);
    setResendTimer(60);
    
    try {
      await otpService.sendOTP(userData.email);
      setLoading(false);
    } catch (error) {
      setError('Failed to send verification code');
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string) => {
    if (/^\d*$/.test(text) && text.length <= 6) {
      setOtp(text);
      const digits = text.split('').concat(Array(6 - text.length).fill(''));
      setOtpDigits(digits.slice(0, 6));
    }
  };

  const handleDigitChange = (index: number, text: string) => {
    if (/^\d*$/.test(text) && text.length <= 1) {
      const newDigits = [...otpDigits];
      newDigits[index] = text;
      setOtpDigits(newDigits);
      setOtp(newDigits.join(''));

      // Auto-focus next input
      if (text && index < 5) {
        // In a real app, you'd use refs to focus the next input
      }
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await otpService.verifyOTP(userData.email, otp);
      
      if (isValid) {
        setVerified(true);
        // Navigate to create password screen
        router.push('/auth/create-password');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    if (canResend) {
      sendVerificationCode();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Verify your email
          </ThemedText>
          <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
            We've sent a 6-digit verification code to
          </ThemedText>
          <ThemedText type="smallBold" style={styles.email}>
            {userData.email}
          </ThemedText>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          <View style={styles.otpInputs}>
            {Array.from({ length: 6 }).map((_, index) => (
              <TextInput
                key={index}
                style={[
                  styles.otpInput,
                  { 
                    backgroundColor: theme.backgroundElement,
                    color: theme.text,
                    borderColor: otpDigits[index] ? '#208AEF' : theme.textSecondary,
                  },
                ]}
                value={otpDigits[index]}
                onChangeText={(text) => handleDigitChange(index, text)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                autoCapitalize="none"
                autoCorrect={false}
              />
            ))}
          </View>
          
          {/* Alternative single input */}
          <TextInput
            style={[
              styles.otpFallbackInput,
              { 
                backgroundColor: theme.backgroundElement,
                color: theme.text,
                borderColor: theme.textSecondary,
              },
            ]}
            value={otp}
            onChangeText={handleOtpChange}
            placeholder="Enter 6-digit code"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            maxLength={6}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Error */}
        {useOnboardingStore.getState().error && (
          <ThemedText type="small" style={styles.errorText}>
            {useOnboardingStore.getState().error}
          </ThemedText>
        )}

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            { 
              backgroundColor: otp.length === 6 ? '#208AEF' : theme.backgroundElement,
              opacity: otp.length === 6 ? 1 : 0.5,
            },
          ]}
          onPress={handleVerify}
          disabled={otp.length !== 6 || isVerifying}>
          <ThemedText type="smallBold" style={styles.verifyButtonText}>
            {isVerifying ? 'Verifying...' : 'Verify'}
          </ThemedText>
        </TouchableOpacity>

        {/* Resend */}
        <View style={styles.resendContainer}>
          <ThemedText type="small" style={[styles.resendText, { color: theme.textSecondary }]}>
            Didn't receive a code?{' '}
          </ThemedText>
          <TouchableOpacity onPress={handleResend} disabled={!canResend}>
            <ThemedText 
              type="linkPrimary" 
              style={[styles.resendLink, { opacity: canResend ? 1 : 0.5 }]}>
              Resend Code
            </ThemedText>
          </TouchableOpacity>
          {resendTimer > 0 && (
            <ThemedText type="small" style={[styles.timer, { color: theme.textSecondary }]}>
              {otpService.formatRemainingTime(userData.email)}
            </ThemedText>
          )}
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.backgroundElement }]}
          onPress={() => router.push('/auth/onboarding')}>
          <ThemedText type="smallBold" style={styles.backButtonText}>
            Back to sign up
          </ThemedText>
        </TouchableOpacity>
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
    textAlign: 'center',
  },
  title: {
    marginBottom: Spacing.two,
  },
  subtitle: {
    marginBottom: Spacing.one,
  },
  email: {
    color: '#208AEF',
  },
  otpContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  otpInputs: {
    flexDirection: 'row',
    justifyContent: 'center',
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
  otpFallbackInput: {
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: Spacing.three,
    textAlign: 'center',
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
    justifyContent: 'center',
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
