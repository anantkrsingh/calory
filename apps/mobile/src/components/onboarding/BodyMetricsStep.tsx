import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LIMITS, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UnitSystem } from '@fitness/types';

interface BodyMetricsStepProps {
  heightCm: number | undefined;
  weightKg: number | undefined;
  onChange: (data: { heightCm?: number; weightKg?: number; unitSystem?: UnitSystem }) => void;
}

export default function BodyMetricsStep({ heightCm, weightKg, onChange }: BodyMetricsStepProps) {
  const theme = useTheme();
  const [height, setHeight] = useState<string>(heightCm?.toString() || '');
  const [weight, setWeight] = useState<string>(weightKg?.toString() || '');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [heightError, setHeightError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);

  const handleHeightChange = (text: string) => {
    setHeight(text);
    setHeightError(null);
    
    if (text === '') {
      onChange({ heightCm: undefined });
      return;
    }
    
    const num = parseFloat(text);
    if (!isNaN(num) && num >= LIMITS.heightCm.min && num <= LIMITS.heightCm.max) {
      onChange({ heightCm: num });
    } else if (text !== '') {
      setHeightError(`Height must be between ${LIMITS.heightCm.min} and ${LIMITS.heightCm.max} cm`);
    }
  };

  const handleWeightChange = (text: string) => {
    setWeight(text);
    setWeightError(null);
    
    if (text === '') {
      onChange({ weightKg: undefined });
      return;
    }
    
    const num = parseFloat(text);
    if (!isNaN(num) && num >= LIMITS.bodyWeightKg.min && num <= LIMITS.bodyWeightKg.max) {
      onChange({ weightKg: num });
    } else if (text !== '') {
      setWeightError(`Weight must be between ${LIMITS.bodyWeightKg.min} and ${LIMITS.bodyWeightKg.max} kg`);
    }
  };

  const handleUnitChange = (system: UnitSystem) => {
    setUnitSystem(system);
    onChange({ unitSystem: system });
  };

  const getUnitLabel = () => {
    if (unitSystem === 'imperial') {
      return {
        heightLabel: 'Height (ft in)',
        weightLabel: 'Weight (lbs)',
        heightPlaceholder: 'e.g., 5.8',
        weightPlaceholder: 'e.g., 160',
      };
    }
    return {
      heightLabel: 'Height (cm)',
      weightLabel: 'Weight (kg)',
      heightPlaceholder: 'e.g., 175',
      weightPlaceholder: 'e.g., 70',
    };
  };

  const labels = getUnitLabel();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Your body metrics
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        This helps us calculate your fitness metrics accurately
      </ThemedText>

      {/* Unit System Toggle */}
      <View style={styles.unitToggle}>
        <TouchableUnit
          label="Metric"
          isActive={unitSystem === 'metric'}
          onPress={() => handleUnitChange('metric')}
        />
        <TouchableUnit
          label="Imperial"
          isActive={unitSystem === 'imperial'}
          onPress={() => handleUnitChange('imperial')}
        />
      </View>

      {/* Height Input */}
      <View style={styles.inputGroup}>
        <ThemedText type="smallBold" style={styles.label}>
          {labels.heightLabel}
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              borderColor: heightError ? '#ff3b30' : theme.textSecondary,
            },
          ]}
          placeholder={labels.heightPlaceholder}
          placeholderTextColor={theme.textSecondary}
          value={height}
          onChangeText={handleHeightChange}
          keyboardType="numeric"
          returnKeyType="done"
        />
        {heightError && <ThemedText type="small" style={styles.errorText}>{heightError}</ThemedText>}
      </View>

      {/* Weight Input */}
      <View style={styles.inputGroup}>
        <ThemedText type="smallBold" style={styles.label}>
          {labels.weightLabel}
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              borderColor: weightError ? '#ff3b30' : theme.textSecondary,
            },
          ]}
          placeholder={labels.weightPlaceholder}
          placeholderTextColor={theme.textSecondary}
          value={weight}
          onChangeText={handleWeightChange}
          keyboardType="numeric"
          returnKeyType="done"
        />
        {weightError && <ThemedText type="small" style={styles.errorText}>{weightError}</ThemedText>}
      </View>

      <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
        We'll use this to calculate your BMI and other health metrics
      </ThemedText>
    </ThemedView>
  );
}

function TouchableUnit({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.unitButton,
        { 
          backgroundColor: isActive ? '#208AEF' : theme.backgroundElement,
          borderColor: theme.textSecondary,
        },
      ]}
      onPress={onPress}>
      <ThemedText type="small" style={{ color: isActive ? 'white' : theme.text }}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create(
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
  unitToggle: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  unitButton: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: Spacing.three,
  },
  label: {
    marginBottom: Spacing.two,
  },
  input: {
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
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
