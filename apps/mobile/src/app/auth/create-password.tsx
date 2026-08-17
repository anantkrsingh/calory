import { AUTH } from '@fitness/config';
import type { RegisterInput } from '@fitness/validation';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import VerifyEmailSheet, { type VerifyEmailSheetRef } from '@/components/auth/VerifyEmailSheet';
import { ThemedText } from '@/components/themed-text';
import CloseButton from '@/components/ui/CloseButton';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { getErrorMessage } from '@/api';
import { Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRegister } from '@/queries';
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
  const register = useRegister();
  const verifyEmailSheetRef = useRef<VerifyEmailSheetRef>(null);
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
      const payload: RegisterInput = {
        email: userData.email,
        password,
        displayName: userData.displayName,
        profile: {
          ...(userData.dateOfBirth ? { dateOfBirth: userData.dateOfBirth } : {}),
          ...(userData.sex ? { sex: userData.sex } : {}),
          ...(userData.heightCm != null ? { heightCm: userData.heightCm } : {}),
          ...(userData.activityLevel ? { activityLevel: userData.activityLevel } : {}),
          ...(userData.fitnessGoals?.length
            ? { fitnessGoals: userData.fitnessGoals }
            : {}),
        },
        ...(userData.weightKg != null
          ? {
              measurement: {
                weightKg: userData.weightKg,
                measurements: {},
                photoUrls: [],
              },
            }
          : {}),
      };

      await register.mutateAsync(payload);
      verifyEmailSheetRef.current?.present();
    } catch (cause) {
      setError(getErrorMessage(cause, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetOnboarding();
    router.dismissTo('/auth/welcome');
  };

  const submitting = isLoading || register.isPending;

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
          {errors.password ? (
            <ThemedText type="small" style={styles.errorText}>
              {errors.password}
            </ThemedText>
          ) : null}
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
          {errors.confirmPassword ? (
            <ThemedText type="small" style={styles.errorText}>
              {errors.confirmPassword}
            </ThemedText>
          ) : null}
        </View>

        {error ? (
          <ThemedText type="small" style={styles.errorMessage}>
            {error}
          </ThemedText>
        ) : null}

        <PrimaryButton
          label={submitting ? 'Creating account...' : 'Continue'}
          onPress={handleSubmit}
          disabled={
            !password ||
            !confirmPassword ||
            password !== confirmPassword ||
            !!errors.password ||
            submitting
          }
          style={styles.submitButton}
        />
      </KeyboardAwareScrollView>

      <VerifyEmailSheet ref={verifyEmailSheetRef} />
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
    justifyContent: 'flex-start',
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
  submitButton: {
    marginBottom: Spacing.three,
  },
});
