import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface DobStepProps {
  dateOfBirth: string | undefined;
  onOpenDatePicker: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDisplayDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return `${MONTH_NAMES[month]} ${day}, ${year}`;
}

export default function DobStep({ dateOfBirth, onOpenDatePicker }: DobStepProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        When were you born?
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        This helps us personalize your experience
      </ThemedText>
      <View style={styles.inputGroup}>
        <ThemedText type="smallBold" style={styles.label}>
          Date of Birth
        </ThemedText>

        <Pressable
          onPress={onOpenDatePicker}
          style={[styles.dateInput, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText
            type="default"
            style={dateOfBirth ? undefined : { color: theme.textSecondary }}>
            {dateOfBirth ? formatDisplayDate(dateOfBirth) : 'Select your date of birth'}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'stretch',
  },
  title: {
    textAlign: 'left',
    marginBottom: Spacing.one,
  },
  subtitle: {
    textAlign: 'left',
    marginBottom: Spacing.four,
  },
  inputGroup: {
    width: '100%',
    marginBottom: Spacing.three,
  },
  label: {
    marginBottom: Spacing.two,
  },
  dateInput: {
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 999,
  },
});
