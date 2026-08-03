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
import { authService } from '@/services/auth.service';

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setErrors({ ...errors, email: '' });
    setFormError(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setErrors({ ...errors, password: '' });
    setFormError(null);
  };

  const validateEmail = (email: string): string => {
    if (email.trim() === '') {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password: string): string => {
    if (password.trim() === '') {
      return 'Password is required';
    }
    return '';
  };

  const handleSubmit = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    setIsLoading(true);
    setFormError(null);

    try {
      await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });

      router.replace('/');
    } catch {
      setFormError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleSignUp = () => {
    router.push('/auth/welcome');
  };

  const canSubmit = email.trim() !== '' && password.trim() !== '' && !errors.email && !errors.password;

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
            Fitness Tracker
          </ThemedText>
          <ThemedText type="small" style={[styles.tagline, { color: theme.textSecondary }]}>
            Welcome back! Sign in to continue
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
                  borderColor: errors.email ? '#ff3b30' : theme.textSecondary,
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
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}>
                <ThemedText type="default" style={styles.eyeIconText}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </ThemedText>
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <ThemedText type="small" style={styles.errorText}>{errors.password}</ThemedText>
            ) : null}
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity onPress={handleForgotPassword}>
              <ThemedText type="linkPrimary" style={styles.forgotPassword}>
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              {
                backgroundColor: canSubmit ? '#208AEF' : theme.backgroundElement,
                opacity: canSubmit ? 1 : 0.5,
              },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || isLoading}>
            <ThemedText type="smallBold" style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </ThemedText>
          </TouchableOpacity>

          {formError ? (
            <ThemedText type="small" style={styles.errorMessage}>
              {formError}
            </ThemedText>
          ) : null}

          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />
            <ThemedText type="small" style={[styles.dividerText, { color: theme.textSecondary }]}>
              or
            </ThemedText>
            <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />
          </View>

          <View style={styles.signupContainer}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Don&apos;t have an account?{' '}
            </ThemedText>
            <TouchableOpacity onPress={handleSignUp}>
              <ThemedText type="linkPrimary" style={styles.signupLink}>
                Sign Up
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
    marginBottom: Spacing.three,
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
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  divider: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 14,
    opacity: 0.6,
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
