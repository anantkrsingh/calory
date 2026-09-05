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
    transform: [{ translateX: translateX.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setRowWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBackground }]}>
      <View style={styles.miniCardsWrapper} onLayout={handleLayout}>
        {columnWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.pill, { backgroundColor: Brand.accent }, pillStyle]}
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
                    styles.miniCard,
                    // Always transparent — an opaque fill here would sit on
                    // top of the sliding accent pill and hide it mid-slide.
                    // A hairline border keeps the card outline without that.
                    { borderColor: theme.border },
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
  },
  miniCardsWrapper: {
    // Positioning context for the sliding accent pill, which sits behind
    // the row of mini cards and animates between their positions.
  },
  pill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: MINI_CARD_HEIGHT,
    borderRadius: MINI_CARD_RADIUS,
    borderCurve: 'continuous',
  },
  row: {
    flexDirection: 'row',
    gap: MINI_CARD_GAP,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  miniCard: {
    alignSelf: 'stretch',
    height: MINI_CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
    borderRadius: MINI_CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth || 1,
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
