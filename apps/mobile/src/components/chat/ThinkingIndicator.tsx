import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { BotAvatar } from '@/components/chat/BotAvatar';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ThinkingIndicatorProps = {
  label?: string;
};

const SHIMMER_DURATION_MS = 900;

/** Shown in place of the assistant bubble while a reply is being generated —
 * a blinking coach icon next to a label that breathes between dim and bright
 * (e.g. "Thinking…", "Checking your profile…"). */
export function ThinkingIndicator({ label = 'Thinking…' }: ThinkingIndicatorProps) {
  const theme = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: SHIMMER_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [shimmer]);

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      shimmer.value,
      [0, 1],
      [theme.textSecondary, theme.text],
    ),
  }));

  return (
    <View style={styles.row}>
      <BotAvatar active size={22} />
      <Animated.Text style={[styles.label, textStyle]}>{label}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
});
