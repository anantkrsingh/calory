import type { DailyCaloriesBurned } from '@fitness/types';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type WeekProgressSheetRef = {
  present: () => void;
};

const HANDLE_COLOR = 'rgba(120, 120, 128, 0.3)';
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BAR_FILL_DURATION_MS = 700;
const TIMELINE_WIDTH = 28;
const DOT_SIZE = 10;
const TODAY_RING_SIZE = 18;
const TODAY_RING_BORDER = 2;
const LINE_WIDTH = 2;

type WeekProgressSheetProps = {
  /** Same 7 entries (Sunday first) shown in the horizontal strip. */
  days: DailyCaloriesBurned[];
  today: string;
};

export const WeekProgressSheet = forwardRef<
  WeekProgressSheetRef,
  WeekProgressSheetProps
>(function WeekProgressSheet({ days, today }, ref) {
  const theme = useTheme();
  const sheetRef = useRef<TrueSheet>(null);
  // Bumped every time the sheet finishes presenting, so the bars reset to 0
  // and animate to their value on every open, not just the first.
  const [presentCount, setPresentCount] = useState(0);

  useImperativeHandle(ref, () => ({
    present: () => {
      void sheetRef.current?.present();
    },
  }));

  const handleDidPresent = useCallback(() => {
    setPresentCount((count) => count + 1);
  }, []);

  return (
    <TrueSheet
      ref={sheetRef}
      detents={['auto']}
      dimmed
      dimmedDetentIndex={0}
      backgroundColor="transparent"
      cornerRadius={0}
      grabber={false}
      onDidPresent={handleDidPresent}>
      <ScrollView
        contentContainerStyle={styles.sheetPadding}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <View style={styles.handle} />

          <ThemedText type="subtitle" style={styles.title}>
            This Week
          </ThemedText>

          <View style={styles.list}>
            {days.map((day, index) => {
              const isToday = day.date === today;
              const isPastOrToday = day.date <= today;
              const progress =
                day.targetCaloriesBurned > 0
                  ? Math.min(1, day.caloriesBurned / day.targetCaloriesBurned)
                  : 0;

              return (
                <View key={day.date} style={styles.row}>
                  <View style={styles.timeline}>
                    <View
                      style={[
                        styles.line,
                        { backgroundColor: theme.border },
                        index === 0 && styles.lineStartsAtDot,
                        index === days.length - 1 && styles.lineEndsAtDot,
                      ]}
                    />
                    {isToday ? (
                      <View
                        style={[
                          styles.todayRing,
                          {
                            borderColor: Brand.accent,
                            backgroundColor: theme.background,
                          },
                        ]}>
                        <View style={[styles.dot, { backgroundColor: Brand.accent }]} />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.dot,
                          isPastOrToday
                            ? { backgroundColor: Brand.accent }
                            : {
                                backgroundColor: theme.background,
                                borderWidth: 2,
                                borderColor: theme.border,
                              },
                        ]}
                      />
                    )}
                  </View>

                  <ThemedText
                    themeColor={isToday ? 'text' : 'textSecondary'}
                    fontWeight={isToday ? '700' : '600'}
                    style={styles.rowLabel}>
                    {WEEKDAY_LABELS[index]}
                  </ThemedText>
                  <View style={styles.rowBar}>
                    <ProgressBar
                      progress={isPastOrToday ? progress : 0}
                      trigger={presentCount}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </TrueSheet>
  );
});

function ProgressBar({ progress, trigger }: { progress: number; trigger: number }) {
  const theme = useTheme();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = 0;
    width.value = withTiming(progress, {
      duration: BAR_FILL_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
    // Replays whenever `trigger` changes (each sheet open) or the target
    // progress itself changes — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, trigger]);

  const style = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
      <Animated.View style={[styles.fill, { backgroundColor: Brand.accent }, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheetPadding: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  card: {
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: Spacing.four,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: HANDLE_COLOR,
    marginBottom: Spacing.three,
  },
  title: {
    textAlign: 'left',
    marginBottom: Spacing.four,
  },
  list: {
    // No gap — rows must touch so the timeline's connecting line is
    // continuous from the first dot to the last.
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 44,
  },
  timeline: {
    width: TIMELINE_WIDTH,
    // Stretch to the row's resolved height — `height: '100%'` can't resolve
    // here since the row's own height is just a `minHeight` (auto), which
    // collapses the whole sheet's measured content under an `auto` detent.
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    marginLeft: -LINE_WIDTH / 2,
    width: LINE_WIDTH,
  },
  lineStartsAtDot: {
    top: '50%',
  },
  lineEndsAtDot: {
    bottom: '50%',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  todayRing: {
    width: TODAY_RING_SIZE,
    height: TODAY_RING_SIZE,
    borderRadius: TODAY_RING_SIZE / 2,
    borderWidth: TODAY_RING_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    width: 40,
    fontSize: 14,
    lineHeight: 20,
  },
  rowBar: {
    flex: 1,
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
