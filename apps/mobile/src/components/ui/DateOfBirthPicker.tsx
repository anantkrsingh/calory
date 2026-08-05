import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type DateOfBirthPickerRef = {
  present: () => void;
};

type DateOfBirthPickerProps = {
  /** ISO date (YYYY-MM-DD), or undefined if nothing picked yet. */
  value: string | undefined;
  onChange: (isoDate: string) => void;
  /** How far back the year picker reaches. @default 100 */
  yearsBack?: number;
};

type Mode = 'day' | 'month' | 'year';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const CELLS_PER_MONTH = 42; // 6 fixed rows so the grid height never jumps between months.
const DEFAULT_YEARS_BACK = 100;
const DEFAULT_ANCHOR_AGE_YEARS = 20;
const GRID_COLUMNS = 4;
const GRID_GAP = 8;
const YEAR_GRID_MAX_HEIGHT = 280;
const CARD_HORIZONTAL_INSET = Spacing.four * 2; // sheetPadding + card padding, one side
const HANDLE_COLOR = 'rgba(120, 120, 128, 0.3)';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function parseISODate(iso: string | undefined): { year: number; month: number; day: number } | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month, day));

  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month || check.getUTCDate() !== day) {
    return null;
  }

  return { year, month, day };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export default forwardRef<DateOfBirthPickerRef, DateOfBirthPickerProps>(function DateOfBirthPicker(
  { value, onChange, yearsBack = DEFAULT_YEARS_BACK },
  ref,
) {
  const theme = useTheme();
  const sheetRef = useRef<TrueSheet>(null);
  const { width: windowWidth } = useWindowDimensions();

  const today = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }, []);
  const minYear = today.year - yearsBack;
  const maxYear = today.year;

  const selected = parseISODate(value);
  const [mode, setMode] = useState<Mode>('day');
  const [viewYear, setViewYear] = useState(selected?.year ?? today.year - DEFAULT_ANCHOR_AGE_YEARS);
  const [viewMonth, setViewMonth] = useState(selected?.month ?? today.month);

  useImperativeHandle(ref, () => ({
    present: () => {
      setMode('day');
      setViewYear(selected?.year ?? today.year - DEFAULT_ANCHOR_AGE_YEARS);
      setViewMonth(selected?.month ?? today.month);
      sheetRef.current?.present();
    },
  }));

  const isAfterToday = (year: number, month: number, day: number): boolean => {
    if (year !== today.year) return year > today.year;
    if (month !== today.month) return month > today.month;
    return day > today.day;
  };

  const handleSelectDay = (day: number) => {
    if (isAfterToday(viewYear, viewMonth, day)) return;
    onChange(toISODate(viewYear, viewMonth, day));
    sheetRef.current?.dismiss();
  };

  const handleSelectMonth = (month: number) => {
    if (viewYear === today.year && month > today.month) return;
    setViewMonth(month);
    setMode('day');
  };

  const handleSelectYear = (year: number) => {
    goToYear(year);
    setMode('month');
  };

  const goToYear = (year: number) => {
    setViewYear(year);
    if (year === today.year && viewMonth > today.month) {
      setViewMonth(today.month);
    }
  };

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewYear === today.year && viewMonth === today.month) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const canGoNextMonth = !(viewYear === today.year && viewMonth === today.month);
  const canGoPrevYear = viewYear > minYear;
  const canGoNextYear = viewYear < maxYear;

  const dayCells = useMemo(() => {
    const firstWeekday = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
    const total = daysInMonth(viewYear, viewMonth);
    const cells: Array<number | null> = Array.from({ length: CELLS_PER_MONTH }, () => null);
    for (let day = 1; day <= total; day += 1) {
      cells[firstWeekday + day - 1] = day;
    }
    return cells;
  }, [viewYear, viewMonth]);

  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index),
    [maxYear, minYear],
  );

  // Pixel-exact sizing so 4-across grids (months/years) and the 7-across day
  // grid always divide the sheet's actual content width evenly, on any device.
  const contentWidth = windowWidth - CARD_HORIZONTAL_INSET * 2;
  const dayCellSize = contentWidth / 7;
  const dayCircleSize = dayCellSize - 8;
  const pillWidth = (contentWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  return (
    <TrueSheet
      ref={sheetRef}
      detents={['auto']}
      backgroundColor="transparent"
      cornerRadius={0}
      grabber={false}
      scrollable>
      <View style={styles.sheetPadding}>
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <View style={styles.handle} />

          {mode === 'day' && (
            <>
              <View style={styles.header}>
                <HeaderChevron direction="prev" onPress={goToPrevMonth} theme={theme} />
                <Pressable onPress={() => setMode('month')} hitSlop={8}>
                  <ThemedText type="smallBold" style={styles.headerTitle}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </ThemedText>
                </Pressable>
                <HeaderChevron
                  direction="next"
                  onPress={goToNextMonth}
                  disabled={!canGoNextMonth}
                  theme={theme}
                />
              </View>

              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((label) => (
                  <View key={label} style={{ width: dayCellSize, alignItems: 'center' }}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {label}
                    </ThemedText>
                  </View>
                ))}
              </View>

              <View style={styles.grid}>
                {dayCells.map((day, index) => {
                  if (day === null) {
                    return <View key={index} style={{ width: dayCellSize, height: dayCellSize }} />;
                  }

                  const isSelected =
                    !!selected && selected.year === viewYear && selected.month === viewMonth && selected.day === day;
                  const isToday =
                    viewYear === today.year && viewMonth === today.month && day === today.day;
                  const disabled = isAfterToday(viewYear, viewMonth, day);

                  return (
                    <View
                      key={index}
                      style={{ width: dayCellSize, height: dayCellSize, alignItems: 'center', justifyContent: 'center' }}>
                      <Pressable
                        disabled={disabled}
                        onPress={() => handleSelectDay(day)}
                        style={[
                          styles.dayCircle,
                          {
                            width: dayCircleSize,
                            height: dayCircleSize,
                            borderRadius: dayCircleSize / 2,
                          },
                          isSelected && { backgroundColor: Brand.accent },
                          !isSelected && isToday && { borderWidth: 1, borderColor: Brand.accent },
                        ]}>
                        <ThemedText
                          type="small"
                          style={{
                            color: isSelected ? 'white' : disabled ? theme.textSecondary : theme.text,
                            opacity: disabled ? 0.4 : 1,
                          }}>
                          {day}
                        </ThemedText>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {mode === 'month' && (
            <>
              <View style={styles.header}>
                <HeaderChevron
                  direction="prev"
                  onPress={() => goToYear(viewYear - 1)}
                  disabled={!canGoPrevYear}
                  theme={theme}
                />
                <Pressable onPress={() => setMode('year')} hitSlop={8}>
                  <ThemedText type="smallBold" style={styles.headerTitle}>
                    {viewYear}
                  </ThemedText>
                </Pressable>
                <HeaderChevron
                  direction="next"
                  onPress={() => goToYear(viewYear + 1)}
                  disabled={!canGoNextYear}
                  theme={theme}
                />
              </View>

              <View style={styles.pillGrid}>
                {MONTH_SHORT.map((label, month) => {
                  const isSelected = viewMonth === month;
                  const disabled = viewYear === today.year && month > today.month;

                  return (
                    <Pressable
                      key={label}
                      disabled={disabled}
                      onPress={() => handleSelectMonth(month)}
                      style={[
                        styles.pill,
                        { width: pillWidth, backgroundColor: theme.backgroundElement },
                        isSelected && { backgroundColor: Brand.accent },
                      ]}>
                      <ThemedText
                        type="small"
                        style={{
                          color: isSelected ? 'white' : theme.text,
                          opacity: disabled ? 0.4 : 1,
                        }}>
                        {label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {mode === 'year' && (
            <>
              <View style={styles.header}>
                <ThemedText type="smallBold" style={[styles.headerTitle, styles.headerTitleCentered]}>
                  Select a year
                </ThemedText>
              </View>

              <ScrollView
                style={styles.yearScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled>
                <View style={styles.pillGrid}>
                  {years.map((year) => {
                    const isSelected = viewYear === year;

                    return (
                      <Pressable
                        key={year}
                        onPress={() => handleSelectYear(year)}
                        style={[
                          styles.pill,
                          { width: pillWidth, backgroundColor: theme.backgroundElement },
                          isSelected && { backgroundColor: Brand.accent },
                        ]}>
                        <ThemedText type="small" style={{ color: isSelected ? 'white' : theme.text }}>
                          {year}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </TrueSheet>
  );
});

function HeaderChevron({
  direction,
  onPress,
  disabled,
  theme,
}: {
  direction: 'prev' | 'next';
  onPress: () => void;
  disabled?: boolean;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      style={[styles.chevronButton, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold" style={{ color: theme.text, opacity: disabled ? 0.3 : 1 }}>
        {direction === 'prev' ? '‹' : '›'}
      </ThemedText>
    </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  headerTitle: {
    fontSize: 16,
  },
  headerTitleCentered: {
    flex: 1,
    textAlign: 'center',
  },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  pill: {
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearScroll: {
    maxHeight: YEAR_GRID_MAX_HEIGHT,
  },
});
