import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HAIRLINE = StyleSheet.hairlineWidth || 1;

type ScreenAppBarProps = {
  title: string;
  onBack?: () => void;
  /** Hide the back control (e.g. root tab screens). */
  showBack?: boolean;
  right?: ReactNode;
};

/** Full-bleed bar with optional back control and trailing actions. */
export function ScreenAppBar({
  title,
  onBack,
  showBack = true,
  right,
}: ScreenAppBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.surface,
          borderBottomColor: theme.border,
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 8 : 0),
        },
      ]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            onPress={handleBack}
            style={styles.backButton}>
            <ChevronLeft color={theme.text} size={24} />
          </Pressable>
        ) : (
          <View style={styles.sideSlot} />
        )}
        <ThemedText fontWeight="700" style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
        <View style={styles.sideSlot}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    zIndex: 1,
    borderBottomWidth: HAIRLINE,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      default: {},
    }),
  },
  row: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
    height: 52,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.two,
    width: '100%',
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sideSlot: {
    alignItems: 'flex-end',
    height: 44,
    justifyContent: 'center',
    minWidth: 44,
  },
  title: {
    flex: 1,
    fontSize: 19,
    lineHeight: 24,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
      default: {},
    }),
  },
});
