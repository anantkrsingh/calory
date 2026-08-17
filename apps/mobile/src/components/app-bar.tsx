import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, MaxContentWidth, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { displayNameOf, firstNameOf, initialsOf } from '@/lib/user';
import { selectUser, useAuthStore } from '@/stores/auth.store';

const AVATAR_SIZE = 42;
const AVATAR_PADDING = 3;
const AVATAR_IMAGE_SIZE = AVATAR_SIZE - AVATAR_PADDING * 2;

/**
 * Full-bleed app bar with greeting and avatar.
 * Light mode: light grey background
 * Dark mode: slightly raised dark background
 */
export function AppBar({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(selectUser);

  const firstName = firstNameOf(user);
  const initials = initialsOf(user);
  const avatarUrl = user?.profile.avatarUrl;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.surface,
          paddingTop: insets.top + Spacing.two,
        },
        style,
      ]}
      {...rest}>
      <View style={styles.row}>
        <View style={styles.greetingContainer}>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            numberOfLines={1}
            style={styles.greeting}>
            Hello,
          </ThemedText>
          <ThemedText
            type="small"
            fontWeight="700"
            themeColor="text"
            numberOfLines={1}
            style={styles.firstName}>
            {firstName}
          </ThemedText>
        </View>

        <Link href="/profile" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Profile, ${displayNameOf(user)}`}
            hitSlop={12}
            style={({ pressed }) => [styles.avatarButton, pressed && Pressed]}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: Brand.accent },
              ]}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  transition={150}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <ThemedText fontWeight="700" style={styles.initials}>
                  {initials}
                </ThemedText>
              )}
            </View>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    // backgroundElement color is light grey in light mode, dark grey in dark mode.
    zIndex: 1,
    boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 8, color: 'rgba(0, 0, 0, 0.08)' }],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    // Tablet support: keep content within max width.
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    minHeight: AVATAR_SIZE + Spacing.two,
  },
  greetingContainer: {
    flex: 1,
    gap: Spacing.half,
  },
  greeting: {
    fontSize: 14,
    lineHeight: 20,
  },
  firstName: {
    fontSize: 18,
    lineHeight: 24,
  },
  avatarButton: {
    flexShrink: 0,
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_IMAGE_SIZE,
    height: AVATAR_IMAGE_SIZE,
    borderRadius: AVATAR_IMAGE_SIZE / 2,
  },
  initials: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
  },
});
