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
import { useTheme } from '@/hooks/use-theme';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MINI_CARD_HEIGHT = 52;
const MINI_CARD_RADIUS = 14;
const MINI_CARD_GAP = Spacing.two;
const SLIDE_DURATION_MS = 280;
const MINI_CARD_ASPECT = 1.15;

type DietWeekSelectorProps = {
  /** This week's dates, Sunday first (see `currentWeekDates`). */
  days: string[];
  today: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

/**
 * The diet plan's Sun–Sat day picker — same sliding-pill layout and animation
 * as `WeekCaloriesStrip` on the home screen, minus its outer card/background
 * (this sits directly on the Plan tab instead of floating above it), and
 * showing each day's calendar date rather than calories burned. Unlike the
 * home screen strip, every day is selectable — a plan covers the whole
 * week, future days included.
 */
export function DietWeekSelector({
  days,
  today,
  selectedDate,
  onSelectDate,
}: DietWeekSelectorProps) {
  const theme = useTheme();
  const [rowWidth, setRowWidth] = useState(0);

  const selectedIndex = Math.max(0, days.indexOf(selectedDate));
  const columnWidth =
    rowWidth > 0 ? (rowWidth - MINI_CARD_GAP * (days.length - 1)) / days.length : 0;
  const miniCardHeight = columnWidth > 0 ? columnWidth * MINI_CARD_ASPECT : MINI_CARD_HEIGHT;

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
    height: miniCardHeight,
    transform: [{ translateX: translateX.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setRowWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.miniCardsWrapper} onLayout={handleLayout}>
      {columnWidth > 0
        ? days.map((date, index) => (
            <View
              key={date}
              pointerEvents="none"
              style={[
                styles.miniCard,
                styles.miniCardBackground,
                {
                  left: index * (columnWidth + MINI_CARD_GAP),
                  width: columnWidth,
                  height: miniCardHeight,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            />
          ))
        : null}

      {columnWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.miniCard, styles.pill, { backgroundColor: Brand.accent }, pillStyle]}
        />
      ) : null}

      <View style={styles.row}>
        {days.map((date, index) => {
          const isSelected = date === selectedDate;
          const isToday = date === today;
          const dayOfMonth = Number(date.split('-')[2]);

          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={`${WEEKDAY_LABELS[index]}${isToday ? ' (today)' : ''}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectDate(date)}
              style={styles.column}>
              <View
                style={[
                  styles.miniCardContent,
                  { height: miniCardHeight },
                ]}>
                <ThemedText
                  fontWeight="700"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    styles.value,
                    { color: theme.text },
                    isSelected && styles.valueSelected,
                  ]}>
                  {dayOfMonth}
                </ThemedText>
              </View>

              <ThemedText
                type="code"
                themeColor={isSelected ? 'text' : 'textSecondary'}
                fontWeight={isSelected ? '800' : '500'}
                style={styles.dayLabel}>
                {WEEKDAY_LABELS[index]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  miniCardsWrapper: {
    alignSelf: 'stretch',
  },
  miniCard: {
    borderCurve: 'continuous',
    borderRadius: MINI_CARD_RADIUS,
  },
  miniCardBackground: {
    position: 'absolute',
    top: 0,
    borderWidth: StyleSheet.hairlineWidth || 1,
    zIndex: 0,
  },
  pill: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
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
