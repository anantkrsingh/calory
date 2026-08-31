import { StyleSheet } from 'react-native';

import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export function BuildScreen() {
  return (
    <TabScreen contentStyle={styles.centered}>
      <ThemedText type="title" style={styles.title}>
        Build
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { opacity: 0.6 }]}>
        Build and manage your workout routines.
      </ThemedText>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
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
});
