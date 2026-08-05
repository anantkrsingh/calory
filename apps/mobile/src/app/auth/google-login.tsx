import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function GoogleLoginScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.icon, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="title">🔒</ThemedText>
          </View>

          <ThemedText type="subtitle" style={styles.title}>
            Google sign-in is not available yet
          </ThemedText>
          <ThemedText type="small" style={[styles.text, { color: theme.textSecondary }]}>
            Sign in with your email and password, or create an account to get started.
          </ThemedText>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: Brand.accent }]}
            onPress={() => router.replace('/auth/login')}>
            <ThemedText type="smallBold" style={styles.primaryButtonText}>
              Sign in with email
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.backgroundElement }]}
            onPress={() => router.back()}>
            <ThemedText type="smallBold" style={styles.secondaryButtonText}>
              Back
            </ThemedText>
          </TouchableOpacity>
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
  content: {
    width: '100%',
    alignItems: 'center',
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  title: {
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  text: {
    textAlign: 'center',
    fontSize: 14,
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
