import type { DailyCaloriesBurned } from '@fitness/types';
import { Image } from 'expo-image';
import { Flame } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FLAME_GIF = require('@/assets/images/arts/flame.gif');
const FLAME_ICON_SIZE = 20;
const FLAME_ICON_SIZE_TODAY = FLAME_ICON_SIZE;
const POP_STAGGER_MS = 120;
const COLUMN_POP_DURATION_MS = 380;
const FLAME_START_OFFSET_MS = 120;
const FLAME_SETTLE_DURATION_MS = 420;
const FLAME_START_SCALE = 1.7;

type WeekCaloriesStripProps = {
  days: DailyCaloriesBurned[];
  today: string;
  /** Opens the weekly-progress history sheet. */
  onPress?: () => void;
};

export function WeekCaloriesStrip({ days, today, onPress }: WeekCaloriesStripProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel="View weekly progress"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && onPress && Pressed,
      ]}>
      <View style={styles.row}>
        {days.map((day, index) => {
          const isToday = day.date === today;
          const isPastOrToday = day.date <= today;
          const delay = index * POP_STAGGER_MS;

          return (
            <Animated.View
              key={day.date}
              entering={ZoomIn.duration(COLUMN_POP_DURATION_MS).delay(delay)}
              style={styles.column}>
              <ThemedText
                themeColor={isToday ? 'text' : 'textSecondary'}
                fontWeight={isToday ? '700' : '500'}
                style={styles.dayLabel}>
                {WEEKDAY_LABELS[index]}
              </ThemedText>

              {isToday ? (
                <Animated.View
                  entering={ZoomIn.duration(FLAME_SETTLE_DURATION_MS)
                    .delay(delay + FLAME_START_OFFSET_MS)
                    .withInitialValues({
                      transform: [{ scale: FLAME_START_SCALE }],
                    })}>
                  <Image
                    source={FLAME_GIF}
                    style={styles.flameGifToday}
                    contentFit="contain"
                    autoplay
                    
                    accessibilityLabel="Today"
                  />
                </Animated.View>
              ) : (
                <Flame
                  color={isPastOrToday ? Brand.accent : theme.border}
                  fill={isPastOrToday ? Brand.accent : 'none'}
                  size={FLAME_ICON_SIZE}
                  strokeWidth={2}
                />
              )}

              <ThemedText
                themeColor={isPastOrToday ? 'text' : 'textSecondary'}
                fontWeight="600"
                style={styles.value}>
                {isPastOrToday ? Math.round(day.caloriesBurned) : '–'}
              </ThemedText>
            </Animated.View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth || 1,
    padding: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  flameGifToday: {
    height: FLAME_ICON_SIZE_TODAY,
    width: FLAME_ICON_SIZE_TODAY,
  },
  value: {
    fontSize: 13,
    lineHeight: 16,
  },
});
