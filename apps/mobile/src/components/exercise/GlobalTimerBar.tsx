import { Square } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Brand, Pressed, Spacing } from '@/constants/theme';
import { useExerciseTimerStore } from '@/stores/exercise-timer.store';

const PILL_HEIGHT = 52;
const CHIP_INSET = Spacing.two;
const TIMER_SLOT_WIDTH = 97;
const EXPAND_DURATION_MS = 280;
const TIMER_TEXT_FADE_MS = 160;
const EASE_OUT = Easing.out(Easing.cubic);
const TICK_MS = 250;

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Floats above every screen in the authenticated app (mounted once in
 * `(app)/_layout`, not the exercise detail screen) whenever the exercise-timer
 * store has a set in progress — so the timer and Stop control survive
 * navigating away from the exercise it was started on. Stop hands off to
 * `LogSetSheet` (also global), which is what actually saves the set.
 */
export function GlobalTimerBar() {
  const exercise = useExerciseTimerStore((state) => state.exercise);
  const startedAt = useExerciseTimerStore((state) => state.startedAt);
  const stop = useExerciseTimerStore((state) => state.stop);
  const insets = useSafeAreaInsets();

  if (!exercise || !startedAt) return null;

  return (
    <TimerPill
      key={startedAt}
      exerciseName={exercise.name}
      startedAt={startedAt}
      onStop={stop}
      bottomInset={insets.bottom}
    />
  );
}

/** Keyed by `startedAt` in the parent so each run gets a fresh mount — and
 * therefore its own expand animation and its own ticking interval. */
function TimerPill({
  exerciseName,
  startedAt,
  onStop,
  bottomInset,
}: {
  exerciseName: string;
  startedAt: number;
  onStop: () => void;
  bottomInset: number;
}) {
  const [elapsedSec, setElapsedSec] = useState(() =>
    Math.floor((Date.now() - startedAt) / 1000),
  );
  // Starts at 0 on every fresh mount, so this bar appears already sized like
  // the local Start pill it replaced (same container/chip dimensions, same
  // position — see ExerciseDetailScreen's matching bottom offset) and then
  // plays the same expand-to-reveal-the-timer animation that pill used to.
  const expand = useSharedValue(0);
  const timerTextOpacity = useSharedValue(0);

  useEffect(() => {
    expand.value = withTiming(1, {
      duration: EXPAND_DURATION_MS,
      easing: EASE_OUT,
    });
    timerTextOpacity.value = withDelay(
      EXPAND_DURATION_MS,
      withTiming(1, { duration: TIMER_TEXT_FADE_MS, easing: EASE_OUT }),
    );

    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, TICK_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt]);

  const timerSlotStyle = useAnimatedStyle(() => ({
    width: expand.value * TIMER_SLOT_WIDTH,
    marginRight: expand.value * Spacing.three,
  }));

  const timerTextStyle = useAnimatedStyle(() => ({
    opacity: timerTextOpacity.value,
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: bottomInset + BottomTabInset + Spacing.three }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Stop ${exerciseName}`}
          hitSlop={8}
          onPress={onStop}
          style={({ pressed }) => [styles.shadowWrap, pressed && Pressed]}>
          <View style={styles.container}>
            <Animated.View
              style={[styles.timerSlot, timerSlotStyle]}
              pointerEvents="none">
              <Animated.View style={timerTextStyle}>
                <ThemedText fontWeight="700" style={styles.timerText}>
                  {formatElapsed(elapsedSec)}
                </ThemedText>
              </Animated.View>
            </Animated.View>

            <View style={styles.buttonChip}>
              <Square color="#FFFFFF" size={18} fill="#FFFFFF" strokeWidth={2} />
              <ThemedText fontWeight="700" style={styles.buttonLabel}>
                Stop
              </ThemedText>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    left: 0,
    paddingHorizontal: Spacing.four,
    position: 'absolute',
    right: 0,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  shadowWrap: {
    borderRadius: 999,
    elevation: 4,
    height: PILL_HEIGHT + CHIP_INSET * 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  container: {
    alignItems: 'center',
    backgroundColor: Brand.ctaOutline,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    height: '100%',
    overflow: 'hidden',
    padding: CHIP_INSET,
  },
  timerSlot: {
    alignItems: 'center',
    height: PILL_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontVariant: ['tabular-nums'],
  },
  buttonChip: {
    alignItems: 'center',
    backgroundColor: Brand.ink,
    borderCurve: 'continuous',
    borderRadius: 999,
    flexDirection: 'row',
    gap: Spacing.two,
    height: PILL_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
  },
});
