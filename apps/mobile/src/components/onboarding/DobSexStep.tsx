import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

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

export default function DobSexStep({ dateOfBirth, sex, onChange }: DobSexStepProps) {
  const theme = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    dateOfBirth ? new Date(dateOfBirth) : null
  );
  const [selectedSex, setSelectedSex] = useState<Sex | undefined>(sex);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      onChange({ dateOfBirth: formattedDate });
    }
  };

  const handleSexSelect = (value: Sex) => {
    setSelectedSex(value);
    onChange({ sex: value });
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select your date of birth';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

      {/* Date of Birth */}
      <View style={styles.inputGroup}>
        <ThemedText type="smallBold" style={styles.label}>
          Date of Birth
        </ThemedText>
        
        <TouchableOpacity
          style={[
            styles.dateButton,
            { backgroundColor: theme.backgroundElement, borderColor: theme.textSecondary },
          ]}
          onPress={() => setShowDatePicker(true)}>
          <ThemedText type="small" style={{ color: selectedDate ? theme.text : theme.textSecondary }}>
            {formatDate(selectedDate)}
          </ThemedText>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}
      </View>

      {/* Sex Selection */}
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
  dateButton: {
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
});
