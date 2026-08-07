import { BicepsFlexed, Check, Dumbbell, HeartPulse, Trophy, TrendingDown, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Chip from '@/components/ui/Chip';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface GoalsStepProps {
  fitnessGoals: string[] | undefined;
  onChange: (data: { fitnessGoals?: string[] }) => void;
}

const GOAL_OPTIONS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'lose_weight', label: 'Lose Weight', Icon: TrendingDown },
  { id: 'build_muscle', label: 'Build Muscle', Icon: Dumbbell },
  { id: 'improve_fitness', label: 'Improve Fitness', Icon: BicepsFlexed },
  { id: 'gain_strength', label: 'Gain Strength', Icon: Dumbbell },
  { id: 'stay_healthy', label: 'Stay Healthy', Icon: HeartPulse },
  { id: 'train_sport', label: 'Train for Sport', Icon: Trophy },
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
        {GOAL_OPTIONS.map(({ id, label, Icon }) => {
          const isSelected = selected.has(id);

          return (
            <Chip
              key={id}
              label={label}
              selected={isSelected}
              onPress={() => handleToggleGoal(id)}
              icon={
                isSelected ? (
                  <Check size={18} color={Brand.accent} />
                ) : (
                  <Icon size={18} color={theme.text} />
                )
              }
            />
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
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
});
