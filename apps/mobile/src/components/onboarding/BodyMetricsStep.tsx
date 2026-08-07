import { LIMITS, UNIT_CONVERSION } from '@fitness/config';
import type { UnitSystem } from '@fitness/types';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface BodyMetricsStepProps {
  heightCm: number | undefined;
  weightKg: number | undefined;
  unitSystem: UnitSystem;
  onChange: (data: { heightCm?: number; weightKg?: number; unitSystem?: UnitSystem }) => void;
}

type Metric = 'height' | 'weight';

const round = (value: number): number => Math.round(value * 10) / 10;

function toDisplay(value: number, metric: Metric, system: UnitSystem): number {
  if (system === 'metric') return round(value);
  return round(
    metric === 'height' ? value / UNIT_CONVERSION.cmPerInch : value / UNIT_CONVERSION.kgPerLb,
  );
}

function toMetric(value: number, metric: Metric, system: UnitSystem): number {
  if (system === 'metric') return value;
  return metric === 'height'
    ? value * UNIT_CONVERSION.cmPerInch
    : value * UNIT_CONVERSION.kgPerLb;
}

function unitLabel(metric: Metric, system: UnitSystem): string {
  if (metric === 'height') return system === 'imperial' ? 'in' : 'cm';
  return system === 'imperial' ? 'lbs' : 'kg';
}

function rangeMessage(metric: Metric, system: UnitSystem): string {
  const limits = metric === 'height' ? LIMITS.heightCm : LIMITS.bodyWeightKg;
  const min = toDisplay(limits.min, metric, system);
  const max = toDisplay(limits.max, metric, system);
  const noun = metric === 'height' ? 'Height' : 'Weight';
  return `${noun} must be between ${min} and ${max} ${unitLabel(metric, system)}`;
}

export default function BodyMetricsStep({
  heightCm,
  weightKg,
  unitSystem,
  onChange,
}: BodyMetricsStepProps) {
  const theme = useTheme();
  const [height, setHeight] = useState(
    heightCm === undefined ? '' : String(toDisplay(heightCm, 'height', unitSystem)),
  );
  const [weight, setWeight] = useState(
    weightKg === undefined ? '' : String(toDisplay(weightKg, 'weight', unitSystem)),
  );
  const [heightError, setHeightError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);

  const handleValueChange = (metric: Metric, text: string) => {
    const setText = metric === 'height' ? setHeight : setWeight;
    const setError = metric === 'height' ? setHeightError : setWeightError;
    const limits = metric === 'height' ? LIMITS.heightCm : LIMITS.bodyWeightKg;
    const emit = (value: number | undefined) =>
      onChange(metric === 'height' ? { heightCm: value } : { weightKg: value });

    setText(text);
    setError(null);

    if (text.trim() === '') {
      emit(undefined);
      return;
    }

    const parsed = Number.parseFloat(text);
    if (Number.isNaN(parsed)) {
      setError(rangeMessage(metric, unitSystem));
      emit(undefined);
      return;
    }

    const metricValue = round(toMetric(parsed, metric, unitSystem));
    if (metricValue < limits.min || metricValue > limits.max) {
      setError(rangeMessage(metric, unitSystem));
      emit(undefined);
      return;
    }

    emit(metricValue);
  };

  const handleUnitChange = (system: UnitSystem) => {
    if (system === unitSystem) return;

    setHeight(heightCm === undefined ? '' : String(toDisplay(heightCm, 'height', system)));
    setWeight(weightKg === undefined ? '' : String(toDisplay(weightKg, 'weight', system)));
    setHeightError(null);
    setWeightError(null);
    onChange({ unitSystem: system });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Your body metrics
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        This helps us calculate your fitness metrics accurately
      </ThemedText>

      <View style={styles.unitToggle}>
        <SegmentedControl
          values={['Metric', 'Imperial']}
          selectedIndex={unitSystem === 'metric' ? 0 : 1}
          onValueChange={(value) => handleUnitChange(value.toLowerCase() as UnitSystem)}
          tintColor={Brand.accent}
          style={styles.segmentedControl}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="smallBold" style={styles.label}>
          Height ({unitLabel('height', unitSystem)})
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              borderWidth: heightError ? 1.5 : 0,
              borderColor: '#ff3b30',
            },
          ]}
          placeholder={unitSystem === 'imperial' ? 'e.g., 69' : 'e.g., 175'}
          placeholderTextColor={theme.textSecondary}
          value={height}
          onChangeText={(text) => handleValueChange('height', text)}
          keyboardType="numeric"
          returnKeyType="done"
        />
        {heightError ? (
          <ThemedText type="small" style={styles.errorText}>
            {heightError}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="smallBold" style={styles.label}>
          Weight ({unitLabel('weight', unitSystem)})
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              borderWidth: weightError ? 1.5 : 0,
              borderColor: '#ff3b30',
            },
          ]}
          placeholder={unitSystem === 'imperial' ? 'e.g., 155' : 'e.g., 70'}
          placeholderTextColor={theme.textSecondary}
          value={weight}
          onChangeText={(text) => handleValueChange('weight', text)}
          keyboardType="numeric"
          returnKeyType="done"
        />
        {weightError ? (
          <ThemedText type="small" style={styles.errorText}>
            {weightError}
          </ThemedText>
        ) : null}
      </View>

      <ThemedText type="small" style={[styles.hint, { color: theme.textSecondary }]}>
        We&apos;ll use this to calculate your BMI and other health metrics
      </ThemedText>
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
  unitToggle: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.four,
  },
  segmentedControl: {
    width: 180,
    height: 32,
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
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 999,
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
    textAlign: 'left',
  },
});
