import { StyleSheet } from 'react-native';

import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export default function ChatScreen() {
  return (
    <TabScreen contentStyle={styles.centered}>
      <ThemedText type="title" style={styles.title}>
        Chat
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { opacity: 0.6 }]}>
        Ask questions and get coaching, anytime.
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
