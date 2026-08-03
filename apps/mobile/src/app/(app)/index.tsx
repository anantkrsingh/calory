import { Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { selectUser, useAuthStore } from '@/stores/auth.store';

export default function HomeScreen() {
  const user = useAuthStore(selectUser);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          {user ? (
            <>
              <ThemedText type="subtitle" style={styles.greeting}>
                Welcome back,
              </ThemedText>
              <ThemedText type="title" style={styles.title}>
                {user.profile.displayName || user.email}
              </ThemedText>
              <ThemedText type="small" style={[styles.subtitle, { opacity: 0.6 }]}>
                Ready to crush your fitness goals today?
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText type="title" style={styles.title}>
                Welcome to Fitness Tracker
              </ThemedText>
              <ThemedText type="small" style={[styles.subtitle, { opacity: 0.6 }]}>
                Your personal fitness companion
              </ThemedText>
            </>
          )}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.content}>
          {user ? (
            <>
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Quick Actions
              </ThemedText>
              <ThemedView style={styles.quickActions}>
                <QuickActionCard icon="🏋️" title="Start Workout" />
                <QuickActionCard icon="📊" title="View Progress" />
                <QuickActionCard icon="🎯" title="My Goals" />
                <QuickActionCard icon="📅" title="My Routines" />
              </ThemedView>
            </>
          ) : (
            <ThemedView style={styles.guestContent}>
              <ThemedText type="small" style={styles.guestTitle}>
                Get started with Fitness Tracker
              </ThemedText>
              <ThemedText type="small" style={[styles.guestText, { opacity: 0.6 }]}>
                Sign up or log in to start tracking your fitness journey
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

function QuickActionCard({ icon, title }: { icon: string; title: string }) {
  return (
    <ThemedView style={styles.actionCard}>
      <ThemedText type="title" style={styles.actionIcon}>{icon}</ThemedText>
      <ThemedText type="smallBold" style={styles.actionTitle}>{title}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  greeting: {
    fontSize: 24,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
  },
  content: {
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: Spacing.two,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: Spacing.one,
  },
  actionTitle: {
    textAlign: 'center',
    fontSize: 12,
  },
  guestContent: {
    alignItems: 'center',
    padding: Spacing.four,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  guestText: {
    textAlign: 'center',
  },
});
