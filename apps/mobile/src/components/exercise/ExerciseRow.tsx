import type { Exercise } from '@fitness/types';
import { Image } from 'expo-image';
import { ChevronRight, Dumbbell } from 'lucide-react-native';
import { memo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HAIRLINE = StyleSheet.hairlineWidth || 1;

type ExerciseRowProps = {
  exercise: Exercise;
  onPress: (exercise: Exercise) => void;
};

function ExerciseRowComponent({ exercise, onPress }: ExerciseRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={exercise.name}
      onPress={() => onPress(exercise)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && Pressed,
      ]}>
      <View
        style={[styles.thumbWrap, { }]}>
        {exercise.thumbnail ? (
          <Image
            source={{ uri: exercise.thumbnail }}
            style={styles.thumb}
            contentFit="contain"
            transition={150}
          />
        ) : (
          <Dumbbell color={theme.textSecondary} size={20} strokeWidth={2} />
        )}
      </View>

      <View style={styles.copy}>
        <ThemedText fontWeight="700" numberOfLines={1} style={styles.name}>
          {exercise.name}
        </ThemedText>
        {exercise.instructions ? (
          <ThemedText
            themeColor="textSecondary"
            numberOfLines={2}
            fontWeight='300'
            style={styles.instructions}>
            {exercise.instructions}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.viewMore}>
        <ThemedText themeColor="textSecondary" style={styles.viewMoreLabel}>
          View more
        </ThemedText>
        <ChevronRight color={theme.textSecondary} size={18} />
      </View>
    </Pressable>
  );
}

export const ExerciseRow = memo(ExerciseRowComponent);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: HAIRLINE,
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      default: {},
    }),
  },
  thumbWrap: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 52,
  },
  thumb: {
    height: '100%',
    width: '100%',
  },
  copy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    lineHeight: 22,
  },
  instructions: {
    fontSize: 12,
    lineHeight: 18,
  },
  viewMore: {
    alignItems: 'center',
    gap: 2,
  },
  viewMoreLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
});
