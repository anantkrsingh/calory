import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Sex } from '@fitness/types';

interface DobSexStepProps {
  dateOfBirth: string | undefined;
  sex: Sex | undefined;
  onChange: (data: { dateOfBirth?: string; sex?: Sex }) => void;
}

const DOB_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!DOB_PATTERN.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getTime() <= Date.now()
  );
}

export default function DobSexStep({ dateOfBirth, sex, onChange }: DobSexStepProps) {
  const theme = useTheme();
  const [selectedSex, setSelectedSex] = useState<Sex | undefined>(sex);
  const [dob, setDob] = useState(dateOfBirth ?? '');
  const [dobError, setDobError] = useState<string | null>(null);

  const handleSexSelect = (value: Sex) => {
    setSelectedSex(value);
    onChange({ sex: value });
  };

  const handleDobChange = (text: string) => {
    setDob(text);

    if (text === '') {
      setDobError(null);
      onChange({ dateOfBirth: '' });
      return;
    }

    if (isValidDate(text)) {
      setDobError(null);
      onChange({ dateOfBirth: text });
      return;
    }

    setDobError(null);
    onChange({ dateOfBirth: '' });
  };

  const handleDobBlur = () => {
    setDobError(dob === '' || isValidDate(dob) ? null : 'Enter a valid date as YYYY-MM-DD');
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
        
        <TextInput
          style={[
            styles.dateInput,
            {
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              borderColor: dobError ? '#ff3b30' : theme.textSecondary,
            },
          ]}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.textSecondary}
          value={dob}
          onChangeText={handleDobChange}
          onBlur={handleDobBlur}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        {dobError ? (
          <ThemedText type="small" style={styles.errorText}>
            {dobError}
          </ThemedText>
        ) : null}
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
                    ? '#208AEF' 
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
    fontSize: 16,
    fontWeight: '500',
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
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: Spacing.one,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
});
