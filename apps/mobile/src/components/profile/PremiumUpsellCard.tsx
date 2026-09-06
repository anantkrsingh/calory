import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Crown } from 'lucide-react-native';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Brand, Pressed, Spacing } from '@/constants/theme';

const GLOW_DURATION_MS = 1400;
const GLOW_INSET = -8;

/**
 * The profile screen's "Upgrade to Pro" teaser — an accent-gradient card with
 * a soft breathing halo behind it, so it reads as lit up rather than just
 * another settings row. Sits right under the user card, above the menu groups.
 */
export function PremiumUpsellCard() {
  const router = useRouter();
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: GLOW_DURATION_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + glow.value * 0.35,
    shadowOpacity: 0.35 + glow.value * 0.4,
    shadowRadius: 12 + glow.value * 10,
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Upgrade to Calory Pro"
      onPress={() => router.push('/premium')}
      style={({ pressed }) => [pressed && Pressed]}>
      <View style={styles.wrapper}>
        <Animated.View
          pointerEvents="none"
          style={[styles.glow, { backgroundColor: Brand.accent }, glowStyle]}
        />

        <LinearGradient
          colors={[Brand.accent, '#FF8A3D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}>
          <View style={styles.iconBadge}>
            <Crown size={22} color="#FFFFFF" />
          </View>

          <View style={styles.textBlock}>
            <ThemedText fontWeight="700" style={styles.title}>
              Upgrade to Calory Pro
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Unlock AI diet plans, analytics & more
            </ThemedText>
          </View>

          <ChevronRight size={20} color="#FFFFFF" strokeWidth={2} />
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: GLOW_INSET,
    left: GLOW_INSET,
    right: GLOW_INSET,
    bottom: GLOW_INSET,
    borderRadius: 24,
    shadowColor: Brand.accent,
    shadowOffset: { width: 0, height: 0 },
    ...Platform.select({
      android: { elevation: 10 },
      default: {},
    }),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  textBlock: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    lineHeight: 18,
  },
});
