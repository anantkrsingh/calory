import { AUTH } from '@fitness/config';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import CloseButton from '@/components/ui/CloseButton';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authService } from '@/services/auth.service';
import { selectError, selectIsLoading, useOnboardingStore } from '@/stores/onboarding.store';

export default function CreatePasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const userData = useOnboardingStore((state) => state.userData);
  const isLoading = useOnboardingStore(selectIsLoading);
  const error = useOnboardingStore(selectError);
  const setLoading = useOnboardingStore((state) => state.setLoading);
  const setError = useOnboardingStore((state) => state.setError);
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (pwd: string): string => {
    if (pwd.length < AUTH.minPasswordLength) {
      return `Password must be at least ${AUTH.minPasswordLength} characters`;
    }
    if (pwd.length > AUTH.maxPasswordLength) {
      return `Password must be less than ${AUTH.maxPasswordLength} characters`;
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain a lowercase letter';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain an uppercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain a number';
    }
    return '';
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setErrors({ ...errors, password: '' });
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    setErrors({ ...errors, confirmPassword: '' });
  };

  const handleSubmit = async () => {
    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrors({ ...errors, password: passwordError });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ ...errors, confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.register({
        email: userData.email,
        password,
        displayName: userData.displayName,
      });

      resetOnboarding();
      router.replace('/');
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetOnboarding();
    router.dismissTo('/auth/welcome');
  };

  const passwordStrength = getPasswordStrength(password);

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
            Create your password
          </ThemedText>
          <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Secure your account with a strong password
          </ThemedText>
        </View>
        <View style={styles.inputContainer}>
          <ThemedText type="smallBold" style={styles.label}>
            Password
          </ThemedText>
          <View style={styles.passwordInputWrapper}>
            <TextInput
              style={[
                styles.passwordInput,
                { 
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                  borderColor: errors.password ? '#ff3b30' : theme.textSecondary,
                },
              ]}
              placeholder="Enter your password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
            <Pressable
              style={({ pressed }) => [
                styles.eyeIcon,
                pressed && { opacity: Pressed.opacity, transform: [{ translateY: -12 }, { scale: 0.99 }] },
              ]}
              onPress={() => setShowPassword(!showPassword)}>
              <ThemedText type="default" style={styles.eyeIconText}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </ThemedText>
            </Pressable>
          </View>
          {errors.password ? (
            <ThemedText type="small" style={styles.errorText}>{errors.password}</ThemedText>
          ) : (
            <View style={styles.strengthIndicator}>
              <View style={styles.strengthBar}>
                <View style={[styles.strengthFill, { 
                  width: `${passwordStrength * 25}%`, 
                  backgroundColor: getStrengthColor(passwordStrength)
                }]} />
              </View>
              <ThemedText type="small" style={[styles.strengthText, { color: theme.textSecondary }]}>
                {getStrengthLabel(passwordStrength)}
              </ThemedText>
            </View>
          )}
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
                  borderColor: errors.confirmPassword ? '#ff3b30' : theme.textSecondary,
                },
              ]}
              placeholder="Confirm your password"
              placeholderTextColor={theme.textSecondary}
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
            <Pressable
              style={({ pressed }) => [
                styles.eyeIcon,
                pressed && { opacity: Pressed.opacity, transform: [{ translateY: -12 }, { scale: 0.99 }] },
              ]}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <ThemedText type="default" style={styles.eyeIconText}>
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </ThemedText>
            </Pressable>
          </View>
          {errors.confirmPassword ? (
            <ThemedText type="small" style={styles.errorText}>{errors.confirmPassword}</ThemedText>
          ) : null}
        </View>

        <View style={styles.requirements}>
          <ThemedText type="smallBold" style={styles.requirementsTitle}>
            Password requirements:
          </ThemedText>
          <RequirementItem
            label={`At least ${AUTH.minPasswordLength} characters`}
            met={password.length >= AUTH.minPasswordLength}
          />
          <RequirementItem
            label="Contains uppercase letter (A-Z)"
            met={/[A-Z]/.test(password)}
          />
          <RequirementItem
            label="Contains lowercase letter (a-z)"
            met={/[a-z]/.test(password)}
          />
          <RequirementItem
            label="Contains a number (0-9)"
            met={/[0-9]/.test(password)}
          />
        </View>

        {error ? (
          <ThemedText type="small" style={styles.errorMessage}>
            {error}
          </ThemedText>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: password && confirmPassword && password === confirmPassword && !errors.password
                ? Brand.accent
                : theme.backgroundElement,
              opacity: password && confirmPassword && password === confirmPassword && !errors.password ? 1 : 0.5,
            },
            pressed && Pressed,
          ]}
          onPress={handleSubmit}
          disabled={!password || !confirmPassword || password !== confirmPassword || !!errors.password || isLoading}>
          <ThemedText type="smallBold" style={styles.submitButtonText}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: theme.backgroundElement },
            pressed && Pressed,
          ]}
          onPress={() => router.back()}>
          <ThemedText type="smallBold" style={styles.backButtonText}>
            Back
          </ThemedText>
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function RequirementItem({ label, met }: { label: string; met: boolean }) {
  const theme = useTheme();

  return (
    <View style={styles.requirementItem}>
      <ThemedText type="small" style={{ color: met ? '#28a745' : theme.textSecondary }}>
        {met ? '✓' : '○'}
      </ThemedText>
      <ThemedText 
        type="small" 
        style={[
          styles.requirementText,
          { color: met ? '#28a745' : theme.textSecondary }
        ]}>
        {label}
      </ThemedText>
    </View>
  );
}

function getPasswordStrength(password: string): number {
  if (password.length === 0) return 0;
  if (password.length < 6) return 1;
  if (password.length < 10) return 2;
  if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return 4;
  return 3;
}

function getStrengthColor(strength: number): string {
  const colors = ['#ff3b30', '#ff9500', '#ffcc00', '#28a745'];
  return colors[strength - 1] || colors[0];
}

function getStrengthLabel(strength: number): string {
  const labels = ['', 'Very Weak', 'Weak', 'Good', 'Strong'];
  return labels[strength] || '';
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
    fontSize: 12,
    marginTop: Spacing.one,
  },
  errorMessage: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'left',
    marginBottom: Spacing.three,
  },
  strengthIndicator: {
    marginTop: Spacing.two,
  },
  strengthBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.one,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    textAlign: 'left',
  },
  requirements: {
    width: '100%',
    marginBottom: Spacing.four,
  },
  requirementsTitle: {
    marginBottom: Spacing.two,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  requirementText: {
    fontSize: 12,
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
