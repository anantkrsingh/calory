import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import DateOfBirthPicker, { type DateOfBirthPickerRef } from '@/components/ui/DateOfBirthPicker';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Sex } from '@fitness/types';

interface DobSexStepProps {
  dateOfBirth: string | undefined;
  sex: Sex | undefined;
  onChange: (data: { dateOfBirth?: string; sex?: Sex }) => void;
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

export default function DobSexStep({ dateOfBirth, sex, onChange }: DobSexStepProps) {
  const theme = useTheme();
  const [selectedSex, setSelectedSex] = useState<Sex | undefined>(sex);
  const pickerRef = useRef<DateOfBirthPickerRef>(null);

  const handleSexSelect = (value: Sex) => {
    setSelectedSex(value);
    onChange({ sex: value });
  };

  const sexOptions: Sex[] = ['male', 'female', 'other', 'prefer_not_to_say'];

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
          onPress={() => pickerRef.current?.present()}
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

        <DateOfBirthPicker
          ref={pickerRef}
          value={dateOfBirth}
          onChange={(isoDate) => onChange({ dateOfBirth: isoDate })}
        />
      </View>
      <View style={styles.inputGroup}>
        <ThemedText type="smallBold" style={styles.label}>
          Sex
        </ThemedText>

        <View style={styles.sexOptions}>
          {sexOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sexOption,
                {
                  backgroundColor: selectedSex === option
                    ? Brand.accent
                    : theme.backgroundElement,
                  borderColor: theme.textSecondary,
                },
              ]}
              onPress={() => handleSexSelect(option)}>
              <ThemedText
                type="small"
                style={[
                  styles.sexOptionText,
                  { color: selectedSex === option ? 'white' : theme.text }
                ]}>
                {formatSexOption(option)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
        This information helps us provide better recommendations
      </ThemedText>
    </ThemedView>
  );
}

function formatSexOption(option: Sex): string {
  const mapping: Record<Sex, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
    prefer_not_to_say: 'Prefer not to say',
  };
  return mapping[option] || option;
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
  sexOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sexOption: {
    flex: 1,
    minWidth: '45%',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sexOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    textAlign: 'left',
  },
});
