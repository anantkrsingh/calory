import type { TodayRoutineExercise } from '@fitness/types';
import { Check, ChevronRight, Dumbbell } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function formatPrescription(exercise: TodayRoutineExercise): string {
  const parts = [`${exercise.sets} set${exercise.sets === 1 ? '' : 's'}`];
  if (exercise.reps) parts.push(`${exercise.reps} reps`);
  else if (exercise.durationSec) parts.push(`${exercise.durationSec}s`);
  return parts.join(' · ');
}

type TodayExerciseRowProps = {
  exercise: TodayRoutineExercise;
  onPress: (exercise: TodayRoutineExercise) => void;
};

function TodayExerciseRowComponent({ exercise, onPress }: TodayExerciseRowProps) {
  const theme = useTheme();
  const { isCompleted, completedSets, sets } = exercise;
  const inProgress = !isCompleted && completedSets > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={exercise.exerciseName}
      accessibilityState={{ checked: isCompleted }}
      onPress={() => onPress(exercise)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border },
        isCompleted && styles.completedRow,
        pressed && Pressed,
      ]}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: isCompleted
              ? Brand.accent
              : 'rgba(239, 90, 36, 0.12)',
          },
        ]}>
        {isCompleted ? (
          <Check color="#FFFFFF" size={18} strokeWidth={3} />
        ) : (
          <Dumbbell color={Brand.accent} size={18} strokeWidth={2} />
        )}
      </View>

      <View style={styles.copy}>
        <ThemedText
          fontWeight="700"
          numberOfLines={1}
          style={[styles.name, isCompleted && { textDecorationLine: 'line-through' }]}>
          {exercise.exerciseName}
        </ThemedText>
        <ThemedText themeColor="textSecondary" numberOfLines={1} style={styles.meta}>
          {isCompleted
            ? 'Completed'
            : inProgress
              ? `${completedSets}/${sets} sets done`
              : formatPrescription(exercise)}
        </ThemedText>
      </View>

      <ChevronRight color={theme.textSecondary} size={18} />
    </Pressable>
  );
}

export const TodayExerciseRow = memo(TodayExerciseRowComponent);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth || 1,
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  completedRow: {
    opacity: 0.55,
  },
  badge: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    lineHeight: 20,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
});
