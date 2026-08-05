import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface GoalsStepProps {
  fitnessGoals: string[] | undefined;
  onChange: (data: { fitnessGoals?: string[] }) => void;
}

const GOAL_OPTIONS = [
  { id: 'lose_weight', label: 'Lose Weight', icon: '⬇️', description: 'Burn fat and reduce body weight' },
  { id: 'build_muscle', label: 'Build Muscle', icon: '💪', description: 'Increase muscle mass and strength' },
  { id: 'improve_fitness', label: 'Improve Fitness', icon: '🏃', description: 'Enhance cardiovascular health and endurance' },
  { id: 'gain_strength', label: 'Gain Strength', icon: '🏋️', description: 'Increase power and lifting capacity' },
  { id: 'stay_healthy', label: 'Stay Healthy', icon: '💚', description: 'Maintain overall health and wellness' },
  { id: 'train_sport', label: 'Train for Sport', icon: '🏆', description: 'Prepare for competitive sports or events' },
];

export default function GoalsStep({ fitnessGoals = [], onChange }: GoalsStepProps) {
  const theme = useTheme();
  const selected = new Set(fitnessGoals);

  const handleToggleGoal = (goalId: string) => {
    const next = selected.has(goalId)
      ? fitnessGoals.filter((goal) => goal !== goalId)
      : [...fitnessGoals, goalId];

    onChange({ fitnessGoals: next });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Your fitness goals
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        Select all that apply to personalize your experience
      </ThemedText>

      <View style={styles.optionsContainer}>
        {GOAL_OPTIONS.map((option) => {
          const isSelected = selected.has(option.id);

          return (
            <Pressable
              key={option.id}
              style={({ pressed }) => [
                styles.optionCard,
                {
                  backgroundColor: isSelected ? '#208AEF' : theme.backgroundElement,
                  borderColor: theme.textSecondary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={() => handleToggleGoal(option.id)}>
              <ThemedText type="title" style={styles.optionIcon}>
                {option.icon}
              </ThemedText>
              <ThemedText
                type="smallBold"
                style={[styles.optionTitle, { color: isSelected ? 'white' : theme.text }]}>
                {option.label}
              </ThemedText>
              <ThemedText
                type="small"
                style={[
                  styles.optionDescription,
                  { color: isSelected ? 'rgba(255, 255, 255, 0.8)' : theme.textSecondary },
                ]}>
                {option.description}
              </ThemedText>
              {isSelected ? (
                <View style={styles.selectedIndicator}>
                  <ThemedText type="smallBold" style={styles.selectedMark}>
                    ✓
                  </ThemedText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
        {fitnessGoals.length > 0
          ? `${fitnessGoals.length} goal${fitnessGoals.length === 1 ? '' : 's'} selected`
          : 'Select at least one goal to continue'}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.three,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'flex-start',
    position: 'relative',
    gap: Spacing.one,
  },
  optionIcon: {
    fontSize: 28,
  },
  optionTitle: {
    textAlign: 'left',
  },
  optionDescription: {
    textAlign: 'left',
    fontSize: 11,
    lineHeight: 14,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMark: {
    color: 'white',
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
});
