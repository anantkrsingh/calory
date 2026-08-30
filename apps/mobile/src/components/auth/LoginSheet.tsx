import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
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
import { Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { authService } from '@/services/auth.service';

export type LoginSheetRef = {
  present: () => void;
};

const HANDLE_COLOR = 'rgba(120, 120, 128, 0.3)';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default forwardRef<LoginSheetRef>(function LoginSheet(_props, ref) {
  const theme = useTheme();
  const router = useRouter();
  const sheetRef = useRef<TrueSheet>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    present: () => {
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setErrors({ email: '', password: '' });
      setFormError(null);
      setIsLoading(false);
      sheetRef.current?.present();
    },
  }));

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setErrors((prev) => ({ ...prev, email: '' }));
    setFormError(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setErrors((prev) => ({ ...prev, password: '' }));
    setFormError(null);
  };

  const validate = (): boolean => {
    const emailError = email.trim() === ''
      ? 'Email is required'
      : EMAIL_REGEX.test(email)
        ? ''
        : 'Please enter a valid email address';
    const passwordError = password.trim() === '' ? 'Password is required' : '';

    setErrors({ email: emailError, password: passwordError });
    return !emailError && !passwordError;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setFormError(null);

    try {
      const session = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });
      await sheetRef.current?.dismiss();
      router.replace(hasCompletedOnboarding(session.user) ? '/' : '/auth/onboarding');
    } catch {
      setFormError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    await sheetRef.current?.dismiss();
    router.push('/auth/forgot-password');
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
                Welcome back
              </ThemedText>
              <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
                Sign in to continue
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.label}>
                  Email
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderWidth: errors.email ? 1.5 : 0,
                      borderColor: '#ff3b30',
                    },
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                {errors.email ? (
                  <ThemedText type="small" style={styles.errorText}>{errors.email}</ThemedText>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.label}>
                  Password
                </ThemedText>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      {
                        backgroundColor: theme.backgroundElement,
                        color: theme.text,
                        borderWidth: errors.password ? 1.5 : 0,
                        borderColor: '#ff3b30',
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
                    onSubmitEditing={handleSubmit}
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.eyeButton,
                      pressed && { opacity: Pressed.opacity, transform: [{ translateY: -12 }, { scale: 0.99 }] },
                    ]}
                    onPress={() => setShowPassword((value) => !value)}
                    hitSlop={8}>
                    {showPassword ? (
                      <EyeOff size={20} color={theme.textSecondary} />
                    ) : (
                      <Eye size={20} color={theme.textSecondary} />
                    )}
                  </Pressable>
                </View>
                {errors.password ? (
                  <ThemedText type="small" style={styles.errorText}>{errors.password}</ThemedText>
                ) : null}
              </View>

              <Pressable
                style={({ pressed }) => [styles.forgotPassword, pressed && Pressed]}
                onPress={handleForgotPassword}
                hitSlop={8}>
                <ThemedText type="linkPrimary" style={styles.forgotPasswordText}>
                  Forgot Password?
                </ThemedText>
              </Pressable>

              {formError ? (
                <ThemedText type="small" style={styles.formError}>
                  {formError}
                </ThemedText>
              ) : null}

              <PrimaryButton
                label={isLoading ? 'Signing In...' : 'Sign In'}
                onPress={handleSubmit}
                disabled={isLoading}
              />
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
    marginBottom: Spacing.four,
  },
  inputGroup: {
    width: '100%',
    marginBottom: Spacing.three,
  },
  label: {
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
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: Spacing.four,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: Spacing.one,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.four,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formError: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'left',
    marginBottom: Spacing.three,
  },
});
