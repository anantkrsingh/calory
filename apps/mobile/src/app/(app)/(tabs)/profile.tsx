import { Pressable, StyleSheet, View } from 'react-native';

import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Pressed, Spacing } from '@/constants/theme';
import { selectUser, useAuthStore } from '@/stores/auth.store';

export default function ProfileScreen() {
  const user = useAuthStore(selectUser);
  const clearAuth = useAuthStore((state) => state.clear);

  const handleLogout = () => {
    clearAuth();
  };

  return (
    <TabScreen appBar={false} contentStyle={styles.content}>
      <View style={styles.userSection}>
        <ThemedText type="title" style={styles.title}>
          Profile
        </ThemedText>
        <ThemedText type="small" style={[styles.subtitle, { opacity: 0.6 }]}>
          {user ? user.profile.displayName || user.email : 'Sign in to manage your profile.'}
        </ThemedText>
      </View>

      <View style={styles.spacer} />

      {user && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Logout"
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            { borderColor: '#EF5A24' },
            pressed && Pressed,
          ]}>
          <ThemedText fontWeight="700" style={styles.logoutText}>
            Logout
          </ThemedText>
        </Pressable>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
  },
  userSection: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: 28,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
  },
  spacer: {
    flex: 1,
  },
  logoutButton: {
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#EF5A24',
  },
});
