import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Brand } from '@/constants/theme';

type BotAvatarProps = {
  /** Plays the blink loop — only while the coach is thinking or streaming. */
  active?: boolean;
  size?: number;
};

// Mimics a natural blink: hold the eyes open, dip quickly, reopen, repeat.
const BLINK_HOLD_MS = 1700;
const BLINK_CLOSE_MS = 90;
const BLINK_OPEN_MS = 140;

/** Small circular coach avatar with two eyes that blink (their height dips
 * to near-zero and back) while `active`. Idle otherwise. */
export function BotAvatar({ active = false, size = 26 }: BotAvatarProps) {
  const blink = useSharedValue(1);

  useEffect(() => {
    if (active) {
      blink.value = withRepeat(
        withSequence(
          withDelay(
            BLINK_HOLD_MS,
            withTiming(0.12, {
              duration: BLINK_CLOSE_MS,
              easing: Easing.in(Easing.ease),
            }),
          ),
          withTiming(1, {
            duration: BLINK_OPEN_MS,
            easing: Easing.out(Easing.ease),
          }),
        ),
        -1,
      );
    } else {
      cancelAnimation(blink);
      blink.value = withTiming(1, { duration: 150 });
    }

    return () => cancelAnimation(blink);
  }, [active, blink]);

  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));

  const eyeWidth = Math.max(3, Math.round(size * 0.16));
  const eyeHeight = Math.max(6, Math.round(size * 0.34));
  const eyeGap = Math.round(size * 0.24);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: Brand.ink,
        },
      ]}>
      <View style={[styles.eyes, { gap: eyeGap }]}>
        <Animated.View
          style={[
            styles.eye,
            { width: eyeWidth, height: eyeHeight, borderRadius: eyeWidth },
            eyeStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.eye,
            { width: eyeWidth, height: eyeHeight, borderRadius: eyeWidth },
            eyeStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyes: {
    flexDirection: 'row',
  },
  eye: {
    backgroundColor: '#FFFFFF',
  },
});
