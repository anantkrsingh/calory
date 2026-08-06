import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { EyeOff, Mars, Venus, type LucideIcon } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Sex } from '@fitness/types';

interface DobSexStepProps {
  dateOfBirth: string | undefined;
  sex: Sex | undefined;
  onChange: (data: { dateOfBirth?: string; sex?: Sex }) => void;
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

interface SexOption {
  value: Sex;
  label: string;
  Icon: LucideIcon;
}

const TOP_ROW_OPTIONS: SexOption[] = [
  { value: 'male', label: 'Male', Icon: Mars },
  { value: 'female', label: 'Female', Icon: Venus },
];

const PREFER_NOT_TO_SAY_OPTION: SexOption = {
  value: 'prefer_not_to_say',
  label: 'Prefer not to say',
  Icon: EyeOff,
};

export default function DobSexStep({ dateOfBirth, sex, onChange, onOpenDatePicker }: DobSexStepProps) {
  const theme = useTheme();
  const [selectedSex, setSelectedSex] = useState<Sex | undefined>(sex);

  const handleSexSelect = (value: Sex) => {
    setSelectedSex(value);
    onChange({ sex: value });
  };

  const renderOption = ({ value, label, Icon }: SexOption) => {
    const selected = selectedSex === value;
    return (
      <Pressable
        key={value}
        style={[
          styles.sexOption,
          {
            backgroundColor: selected ? Brand.accent : theme.backgroundElement,
            borderColor: theme.textSecondary,
          },
        ]}
        onPress={() => handleSexSelect(value)}>
        <Icon
          size={20}
          color={selected ? 'white' : theme.text}
          style={styles.sexOptionIcon}
        />
        <ThemedText
          type="small"
          style={[
            styles.sexOptionText,
            { color: selected ? 'white' : theme.text }
          ]}>
          {label}
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Tell us about yourself
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
          style={[
            styles.dateInput,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.textSecondary,
            },
          ]}>
          <ThemedText
            type="default"
            style={dateOfBirth ? undefined : { color: theme.textSecondary }}>
            {dateOfBirth ? formatDisplayDate(dateOfBirth) : 'Select your date of birth'}
          </ThemedText>
        </Pressable>
      </View>
      <View style={styles.inputGroup}>
        <ThemedText type="smallBold" style={styles.label}>
          Sex
        </ThemedText>

        <View style={styles.sexOptionsRow}>
          {TOP_ROW_OPTIONS.map((option) => renderOption(option))}
        </View>
        <View style={styles.sexOptionsRow}>
          {renderOption(PREFER_NOT_TO_SAY_OPTION)}
        </View>
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
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  sexOptionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  sexOption: {
    flex: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sexOptionIcon: {
    marginBottom: Spacing.one,
  },
  sexOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
