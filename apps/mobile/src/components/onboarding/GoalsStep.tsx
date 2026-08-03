import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

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
  const [selectedGoals, setSelectedGoals] = useState<string[]>(fitnessGoals);

  const handleToggleGoal = (goalId: string) => {
    const newGoals = selectedGoals.includes(goalId)
      ? selectedGoals.filter((g) => g !== goalId)
      : [...selectedGoals, goalId];
    
    setSelectedGoals(newGoals);
    onChange({ fitnessGoals: newGoals });
  };

  const isSelected = (goalId: string): boolean => selectedGoals.includes(goalId);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Your fitness goals
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        Select all that apply to personalize your experience
      </ThemedText>

      <View style={styles.optionsContainer}>
        {GOAL_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              { 
                backgroundColor: isSelected(option.id) 
                  ? '#208AEF' 
                  : theme.backgroundElement,
                borderColor: theme.textSecondary,
              },
            ]}
            onPress={() => handleToggleGoal(option.id)}>
            <ThemedText type="title" style={styles.optionIcon}>
              {option.icon}
            </ThemedText>
            <ThemedText 
              type="smallBold" 
              style={[
                styles.optionTitle,
                { color: isSelected(option.id) ? 'white' : theme.text }
              ]}>
              {option.label}
            </ThemedText>
            <ThemedText 
              type="small" 
              style={[
                styles.optionDescription,
                { color: isSelected(option.id) ? 'rgba(255, 255, 255, 0.8)' : theme.textSecondary }
              ]}>
              {option.description}
            </ThemedText>
            {isSelected(option.id) && (
              <View style={styles.selectedIndicator}>
                <ThemedText type="smallBold" style={{ color: 'white' }}>✓</ThemedText>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {selectedGoals.length > 0 ? (
        <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
          {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''} selected
        </ThemedText>
      ) : (
        <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
          Select at least one goal to continue
        </ThemedText>
      )}
    </ThemedView>
  );
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
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: Spacing.two,
  },
  optionTitle: {
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  optionDescription: {
    textAlign: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
});
