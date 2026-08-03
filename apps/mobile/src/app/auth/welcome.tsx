import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    setIsLoading(true);
    // Navigate to onboarding flow
    router.push('/auth/onboarding');
  };

  const handleLogin = () => {
    setIsLoading(true);
    // Navigate to login screen
    router.push('/auth/login');
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Navigate to Google login
    router.push('/auth/google-login');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        {/* Logo and App Name */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <ThemedText type="title" style={styles.logoText}>
                Fit
              </ThemedText>
            </View>
          </View>
          <ThemedText type="subtitle" style={styles.appName}>
            Fitness Tracker
          </ThemedText>
          <ThemedText type="small" style={styles.tagline}>
            Your personal fitness companion
          </ThemedText>
        </View>

        {/* Feature Highlights */}
        <View style={styles.features}>
          <FeatureCard
            icon="🏋️"
            title="Track Workouts"
            description="Record and monitor all your exercises"
          />
          <FeatureCard
            icon="📈"
            title="Progress Analytics"
            description="Visualize your fitness journey"
          />
          <FeatureCard
            icon="🎯"
            title="Set Goals"
            description="Achieve your fitness objectives"
          />
        </View>

        {/* Main Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.backgroundElement }]}
            onPress={handleGetStarted}
            disabled={isLoading}>
            <ThemedText type="smallBold" style={styles.primaryButtonText}>
              {isLoading ? 'Loading...' : 'Get Started'}
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />
            <ThemedText type="small" style={styles.dividerText}>
              or continue with
            </ThemedText>
            <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />
          </View>

          {/* Social Login Buttons */}
          <TouchableOpacity
            style={[styles.socialButton, { 
              backgroundColor: theme.backgroundElement,
              borderColor: theme.textSecondary 
            }]}
            onPress={handleGoogleLogin}>
            <ThemedText type="smallBold" style={styles.socialButtonText}>
              🔍 Continue with Google
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { 
              backgroundColor: theme.backgroundElement,
              borderColor: theme.textSecondary 
            }]}
            onPress={handleGoogleLogin}>
            <ThemedText type="smallBold" style={styles.socialButtonText}>
              📧 Continue with Apple
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { 
              backgroundColor: theme.backgroundElement,
              borderColor: theme.textSecondary 
            }]}
            onPress={handleGoogleLogin}>
            <ThemedText type="smallBold" style={styles.socialButtonText}>
              📱 Continue with Phone
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <ThemedText type="small" style={styles.loginText}>
            Already have an account?{' '}
          </ThemedText>
          <Pressable onPress={handleLogin}>
            <ThemedText type="linkPrimary" style={styles.loginLink}>
              Sign In
            </ThemedText>
          </Pressable>
        </View>

        {/* Terms and Privacy */}
        <View style={styles.footer}>
          <ThemedText type="small" style={styles.footerText}>
            By continuing, you agree to our{' '}
            <ThemedText type="linkPrimary">Terms of Service</ThemedText>
            {' and '}
            <ThemedText type="linkPrimary">Privacy Policy</ThemedText>
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.featureCard, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="title" style={styles.featureIcon}>{icon}</ThemedText>
      <ThemedText type="smallBold" style={styles.featureTitle}>{title}</ThemedText>
      <ThemedText type="small" style={[styles.featureDescription, { color: theme.textSecondary }]}>
        {description}
      </ThemedText>
    </View>
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
  logoContainer: {
    marginBottom: Spacing.three,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#208AEF',
  },
  logoText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  appName: {
    marginBottom: Spacing.one,
  },
  tagline: {
    color: 'gray',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.five,
    paddingHorizontal: Spacing.two,
  },
  featureCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: 12,
    marginHorizontal: Spacing.one,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 36,
    marginBottom: Spacing.two,
  },
  featureTitle: {
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  featureDescription: {
    textAlign: 'center',
    fontSize: 12,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  socialButton: {
    width: '100%',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
    borderWidth: 1,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
    gap: Spacing.one,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: Spacing.three,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
