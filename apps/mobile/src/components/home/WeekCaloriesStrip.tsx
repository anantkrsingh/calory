import type { DailyCaloriesBurned } from '@fitness/types';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MINI_CARD_HEIGHT = 52;
const MINI_CARD_RADIUS = 14;
const MINI_CARD_GAP = Spacing.two;
const SLIDE_DURATION_MS = 280;

// A softened, lower-saturation tint of the "Save changes" button's fill
// color (`Brand.ctaFill`, #9DC6C5) — same family, deliberately lighter/less
// dark than the button itself so the card reads as a background, not a CTA.
const CARD_BACKGROUND = {
  light: '#DDEBEB',
  dark: '#3F4F4F',
} as const;

type WeekCaloriesStripProps = {
  days: DailyCaloriesBurned[];
  today: string;
  /** The currently selected day (`YYYY-MM-DD`) — defaults to `today`. */
  selectedDate: string;
  /** Fires when the user taps a past-or-today day to select it. */
  onSelectDate: (date: string) => void;
};

export function WeekCaloriesStrip({
  days,
  today,
  selectedDate,
  onSelectDate,
}: WeekCaloriesStripProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const cardBackground = CARD_BACKGROUND[scheme];
  const [rowWidth, setRowWidth] = useState(0);

  const selectedIndex = Math.max(
    0,
    days.findIndex((day) => day.date === selectedDate),
  );
  const columnWidth =
    rowWidth > 0 ? (rowWidth - MINI_CARD_GAP * (days.length - 1)) / days.length : 0;

  const translateX = useSharedValue(0);
  const isFirstPosition = useRef(true);

  useEffect(() => {
    if (columnWidth <= 0) return;
    const target = selectedIndex * (columnWidth + MINI_CARD_GAP);
    if (isFirstPosition.current) {
      translateX.value = target;
      isFirstPosition.current = false;
    } else {
      translateX.value = withTiming(target, {
        duration: SLIDE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, columnWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    width: columnWidth,
    height: columnWidth,
    transform: [{ translateX: translateX.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setRowWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBackground }]}>
      <View style={styles.miniCardsWrapper} onLayout={handleLayout}>
        {columnWidth > 0
          ? // Static per-day backgrounds, one absolutely-positioned rect per
            // column, painted first (behind everything). Same size as the
            // mini card content below, so dimensions never change.
            days.map((day, index) => (
              <View
                key={day.date}
                pointerEvents="none"
                style={[
                  styles.miniCard,
                  styles.miniCardBackground,
                  {
                    left: index * (columnWidth + MINI_CARD_GAP),
                    // Square — width and height both equal the computed
                    // column width, so it's never a stretched rectangle.
                    width: columnWidth,
                    height: columnWidth,
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              />
            ))
          : null}

        {columnWidth > 0 ? (
          // The active day's highlight — painted after (above) every static
          // background above, so it's never hidden as it slides under them.
          <Animated.View
            pointerEvents="none"
            style={[styles.miniCard, styles.pill, { backgroundColor: Brand.accent }, pillStyle]}
          />
        ) : null}

        <View style={styles.row}>
          {days.map((day, index) => {
            const isSelected = day.date === selectedDate;
            const isPastOrToday = day.date <= today;
            const isToday = day.date === today;
            const hasCalories = isPastOrToday && day.caloriesBurned > 0;

            return (
              <Pressable
                key={day.date}
                disabled={!isPastOrToday}
                accessibilityRole="button"
                accessibilityLabel={`${WEEKDAY_LABELS[index]}${isToday ? ' (today)' : ''}`}
                accessibilityState={{ selected: isSelected, disabled: !isPastOrToday }}
                onPress={() => onSelectDate(day.date)}
                style={styles.column}>
                <View
                  style={[
                    styles.miniCardContent,
                    // Falls back to MINI_CARD_HEIGHT for the one frame before
                    // `columnWidth` is known, then matches it exactly so this
                    // box — which is what actually gives the row its height —
                    // stays square in step with the background/pill above.
                    { height: columnWidth > 0 ? columnWidth : MINI_CARD_HEIGHT },
                  ]}>
                  <ThemedText
                    fontWeight="700"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.value,
                      {
                        color: hasCalories ? theme.text : theme.textSecondary,
                      },
                      isSelected && styles.valueSelected,
                    ]}>
                    {hasCalories ? Math.round(day.caloriesBurned) : '–'}
                  </ThemedText>
                </View>

                <ThemedText
                  themeColor={isSelected ? 'text' : 'textSecondary'}
                  fontWeight={isSelected ? '700' : '500'}
                  style={styles.dayLabel}>
                  {WEEKDAY_LABELS[index]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    borderCurve: 'continuous',
    borderRadius: 20,
    padding: Spacing.three,
    // Tailwind's default `shadow` — two stacked layers, both a soft 10%-black.
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  },
  miniCardsWrapper: {
    // Positioning context for the per-day background rects and the sliding
    // accent pill, both absolutely positioned behind the row of mini cards.
  },
  miniCard: {
    // Height comes from `columnWidth` at each call site instead of a fixed
    // constant, so the card is always a square rather than a rectangle.
    borderCurve: 'continuous',
    borderRadius: MINI_CARD_RADIUS,
  },
  // Static per-day background — always painted first (z-index 0), so the
  // sliding pill above it is never hidden as it passes underneath.
  miniCardBackground: {
    position: 'absolute',
    top: 0,
    borderWidth: StyleSheet.hairlineWidth || 1,
    zIndex: 0,
  },
  // The active day's highlight — painted above every static background
  // (z-index 1) so it stays visible for the whole slide.
  pill: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  // The actual row of touch targets + text, painted last (z-index 2) so
  // labels/numbers always stay on top of both layers above.
  row: {
    flexDirection: 'row',
    gap: MINI_CARD_GAP,
    zIndex: 2,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  miniCardContent: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.half,
  },
  value: {
    fontSize: 15,
    lineHeight: 19,
  },
  valueSelected: {
    color: '#FFFFFF',
  },
  dayLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
});
