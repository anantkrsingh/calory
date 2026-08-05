import type { ActivityLevel } from '@fitness/types';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ActivityStepProps {
  activityLevel: ActivityLevel | undefined;
  onChange: (data: { activityLevel?: ActivityLevel }) => void;
}

const ACTIVITY_LEVELS: ActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
];

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  light: 'Lightly Active',
  moderate: 'Moderately Active',
  active: 'Very Active',
  very_active: 'Extremely Active',
};

const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  sedentary: 'Little or no exercise',
  light: 'Light exercise 1-3 days/week',
  moderate: 'Moderate exercise 3-5 days/week',
  active: 'Hard exercise 6-7 days a week',
  very_active: 'Very hard exercise, physical job, or training twice a day',
};

const ACTIVITY_ICONS: Record<ActivityLevel, string> = {
  sedentary: '🛋️',
  light: '🚶',
  moderate: '🏃',
  active: '💪',
  very_active: '🏋️',
};

export default function ActivityStep({ activityLevel, onChange }: ActivityStepProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Your activity level
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        This helps us tailor your fitness recommendations
      </ThemedText>

      <View style={styles.optionsContainer}>
        {ACTIVITY_LEVELS.map((level) => {
          const isSelected = activityLevel === level;

          return (
            <Pressable
              key={level}
              style={({ pressed }) => [
                styles.optionCard,
                {
                  backgroundColor: isSelected ? '#208AEF' : theme.backgroundElement,
                  borderColor: theme.textSecondary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={() => onChange({ activityLevel: level })}>
              <ThemedText type="title" style={styles.optionIcon}>
                {ACTIVITY_ICONS[level]}
              </ThemedText>
              <ThemedText
                type="smallBold"
                style={[styles.optionTitle, { color: isSelected ? 'white' : theme.text }]}>
                {ACTIVITY_LABELS[level]}
              </ThemedText>
              <ThemedText
                type="small"
                style={[
                  styles.optionDescription,
                  { color: isSelected ? 'rgba(255, 255, 255, 0.8)' : theme.textSecondary },
                ]}>
                {ACTIVITY_DESCRIPTIONS[level]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
        You can adjust this later as your fitness level changes
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'stretch',
    gap: Spacing.one,
  },
  title: {
    textAlign: 'left',
  },
  subtitle: {
    textAlign: 'left',
    marginBottom: Spacing.three,
  },
  optionsContainer: {
    width: '100%',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  optionCard: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  optionIcon: {
    fontSize: 32,
  },
  optionTitle: {
    textAlign: 'left',
  },
  optionDescription: {
    textAlign: 'left',
    fontSize: 12,
  },
  hint: {
    fontSize: 12,
    textAlign: 'left',
  },
});
