import type { ActivityLevel } from '@fitness/types';
import { Armchair, Check, Dumbbell, Flame, Footprints, PersonStanding, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Chip from '@/components/ui/Chip';
import { Brand, Spacing } from '@/constants/theme';
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

const ACTIVITY_ICONS: Record<ActivityLevel, LucideIcon> = {
  sedentary: Armchair,
  light: Footprints,
  moderate: PersonStanding,
  active: Dumbbell,
  very_active: Flame,
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
          const Icon = ACTIVITY_ICONS[level];

          return (
            <Chip
              key={level}
              label={ACTIVITY_LABELS[level]}
              selected={isSelected}
              onPress={() => onChange({ activityLevel: level })}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  hint: {
    fontSize: 12,
    textAlign: 'left',
  },
});
