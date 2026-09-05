import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

const PULSE_DURATION_MS = 900;
const MIN_OPACITY = 0.5;
const MAX_OPACITY = 0.85;

type SkeletonProps = {
  style?: StyleProp<ViewStyle>;
};

/** A breathing placeholder block for loading states — same pulse timing as
 * ThinkingIndicator's shimmer, applied to opacity instead of text color. */
export function Skeleton({ style }: SkeletonProps) {
  const theme = useTheme();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: PULSE_DURATION_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: MIN_OPACITY + pulse.value * (MAX_OPACITY - MIN_OPACITY),
  }));

  return (
    <Animated.View
      style={[styles.base, { backgroundColor: theme.backgroundElement }, animatedStyle, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderCurve: 'continuous',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
