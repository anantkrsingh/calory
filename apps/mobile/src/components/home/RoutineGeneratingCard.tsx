import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const RUNNING_GIF = require('@/assets/images/arts/routine-generating.gif');

const SWEEP_WIDTH_PERCENT = 40;
const SWEEP_DURATION_MS = 1100;

/** Shown on the home screen while the AI is still building the user's weekly
 * routine — an indeterminate progress bar, since generation has no real
 * percentage to report, just `generating` until it flips to `active`. */
export function RoutineGeneratingCard() {
  const theme = useTheme();
  const sweep = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: SWEEP_DURATION_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
    );
  }, [sweep]);

  const sweepStyle = useAnimatedStyle(() => ({
    left: `${sweep.value * (100 + SWEEP_WIDTH_PERCENT) - SWEEP_WIDTH_PERCENT}%`,
  }));

  return (
    <View
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Image
        source={RUNNING_GIF}
        style={styles.gif}
        contentFit="contain"
        autoplay
        accessibilityLabel="Building your plan"
      />
      <ThemedText fontWeight="700" style={styles.title}>
        Building your plan
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.body}>
        Your coach is putting together your personalized week — this usually
        takes a minute or two.
      </ThemedText>
      <View
        style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
        <Animated.View
          style={[styles.sweep, { backgroundColor: Brand.accent }, sweepStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth || 1,
    gap: Spacing.two,
    padding: Spacing.four,
  },
  gif: {
    height: 96,
    width: 96,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  track: {
    alignSelf: 'stretch',
    borderRadius: 999,
    height: 6,
    marginTop: Spacing.two,
    overflow: 'hidden',
  },
  sweep: {
    borderRadius: 999,
    height: '100%',
    position: 'absolute',
    width: `${SWEEP_WIDTH_PERCENT}%`,
  },
});
