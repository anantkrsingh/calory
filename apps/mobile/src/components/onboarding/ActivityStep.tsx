import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ActivityLevel } from '@fitness/types';

interface ActivityStepProps {
  activityLevel: ActivityLevel | undefined;
  onChange: (data: { activityLevel?: ActivityLevel }) => void;
}

export default function ActivityStep({ activityLevel, onChange }: ActivityStepProps) {
  const theme = useTheme();
  const [selectedLevel, setSelectedLevel] = useState<ActivityLevel | undefined>(activityLevel);

  const handleSelect = (level: ActivityLevel) => {
    setSelectedLevel(level);
    onChange({ activityLevel: level });
  };

  const activityLevels: ActivityLevel[] = [
    'sedentary',
    'light',
    'moderate',
    'active',
    'very_active',
  ];

  const getActivityDescription = (level: ActivityLevel): string => {
    const descriptions: Record<ActivityLevel, string> = {
      sedentary: 'Little or no exercise',
      light: 'Light exercise 1-3 days/week',
      moderate: 'Moderate exercise 3-5 days/week',
      active: 'Hard exercise 6-7 days a week',
      very_active: 'Very hard exercise, physical job, or training twice a day',
    };
    return descriptions[level] || '';
  };

  const getActivityIcon = (level: ActivityLevel): string => {
    const icons: Record<ActivityLevel, string> = {
      sedentary: '🛋️',
      light: '🚶',
      moderate: '🏃',
      active: '💪',
      very_active: '🏋️',
    };
    return icons[level] || '❓';
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Your activity level
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        This helps us tailor your fitness recommendations
      </ThemedText>

      <View style={styles.optionsContainer}>
        {activityLevels.map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.optionCard,
              { 
                backgroundColor: selectedLevel === level ? '#208AEF' : theme.backgroundElement,
                borderColor: theme.textSecondary,
              },
            ]}
            onPress={() => handleSelect(level)}>
            <ThemedText type="title" style={styles.optionIcon}>
              {getActivityIcon(level)}
            </ThemedText>
            <ThemedText 
              type="smallBold" 
              style={[
                styles.optionTitle,
                { color: selectedLevel === level ? 'white' : theme.text }
              ]}>
              {formatActivityLevel(level)}
            </ThemedText>
            <ThemedText 
              type="small" 
              style={[
                styles.optionDescription,
                { color: selectedLevel === level ? 'rgba(255, 255, 255, 0.8)' : theme.textSecondary }
              ]}>
              {getActivityDescription(level)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
        You can adjust this later as your fitness level changes
      </ThemedText>
    </ThemedView>
  );
}

function formatActivityLevel(level: ActivityLevel): string {
  const mapping: Record<ActivityLevel, string> = {
    sedentary: 'Sedentary',
    light: 'Lightly Active',
    moderate: 'Moderately Active',
    active: 'Very Active',
    very_active: 'Extremely Active',
  };
  return mapping[level] || level;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.four,
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
    borderWidth: 1,
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: Spacing.two,
  },
  optionTitle: {
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  optionDescription: {
    textAlign: 'center',
    fontSize: 12,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
});
