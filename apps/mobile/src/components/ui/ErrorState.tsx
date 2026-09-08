import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { getErrorMessage } from '@/api/errors';
import { ThemedText } from '@/components/themed-text';
import RetryButton from '@/components/ui/RetryButton';
import { Spacing } from '@/constants/theme';

type ErrorStateProps = {
  title?: string;
  error?: unknown;
  fallback?: string;
  onRetry: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Shared "couldn't load" block for a section that failed to fetch its data —
 * a title, the server/network message (or `fallback`), and a retry control.
 * Mirrors the inline pattern used across the app (e.g. BuildScreen) so every
 * failed-load section reads the same way. */
export function ErrorState({
  title = 'Couldn’t load',
  error,
  fallback = 'Check your connection and try again.',
  onRetry,
  style,
}: ErrorStateProps) {
  return (
    <View style={[styles.container, style]}>
      <ThemedText fontWeight="700" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.body}>
        {getErrorMessage(error, fallback)}
      </ThemedText>
      <RetryButton onPress={onRetry} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: Spacing.three,
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.one,
  },
});
