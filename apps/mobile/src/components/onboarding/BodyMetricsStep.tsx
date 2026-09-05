import { LIMITS, UNIT_CONVERSION } from '@/constants/app';
import type { UnitSystem } from '@fitness/types';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import RulerSlider from '@/components/ui/RulerSlider';
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

// Sensible starting points so the ruler always shows a valid, in-range value —
// the user can scroll from here instead of having to type something first.
const DEFAULT_HEIGHT_CM = 170;
const DEFAULT_WEIGHT_KG = 65;

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

/** Ruler bounds/step, derived from the metric LIMITS so nothing reachable in kg/cm becomes unreachable after a unit toggle. */
function rulerRange(metric: Metric, system: UnitSystem) {
  const limits = metric === 'height' ? LIMITS.heightCm : LIMITS.bodyWeightKg;
  const min = Math.round(toDisplay(limits.min, metric, system));
  const max = Math.round(toDisplay(limits.max, metric, system));

  if (metric === 'height') return { min, max, step: 1, majorStep: 10 };
  return system === 'metric'
    ? { min, max, step: 0.5, majorStep: 10 }
    : { min, max, step: 1, majorStep: 10 };
}

export default function BodyMetricsStep({
  heightCm,
  weightKg,
  unitSystem,
  onChange,
}: BodyMetricsStepProps) {
  const theme = useTheme();

  // Seed defaults once so the ruler starts on a real value and "Continue"
  // doesn't require an interaction before it becomes reachable.
  useEffect(() => {
    if (heightCm === undefined || weightKg === undefined) {
      onChange({
        heightCm: heightCm ?? DEFAULT_HEIGHT_CM,
        weightKg: weightKg ?? DEFAULT_WEIGHT_KG,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  const handleUnitChange = (system: UnitSystem) => {
    if (system !== unitSystem) onChange({ unitSystem: system });
  };

  const heightRange = rulerRange('height', unitSystem);
  const weightRange = rulerRange('weight', unitSystem);
  const displayHeight = toDisplay(heightCm ?? DEFAULT_HEIGHT_CM, 'height', unitSystem);
  const displayWeight = toDisplay(weightKg ?? DEFAULT_WEIGHT_KG, 'weight', unitSystem);

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

      <View style={styles.sliderGroup}>
        <ThemedText type="smallBold" style={styles.label}>
          Height
        </ThemedText>
        <RulerSlider
          {...heightRange}
          value={displayHeight}
          unitLabel={unitLabel('height', unitSystem)}
          accessibilityLabel="Height"
          onChange={(value) => onChange({ heightCm: round(toMetric(value, 'height', unitSystem)) })}
        />
      </View>

      <View style={styles.sliderGroup}>
        <ThemedText type="smallBold" style={styles.label}>
          Weight
        </ThemedText>
        <RulerSlider
          {...weightRange}
          value={displayWeight}
          unitLabel={unitLabel('weight', unitSystem)}
          accessibilityLabel="Weight"
          onChange={(value) => onChange({ weightKg: round(toMetric(value, 'weight', unitSystem)) })}
        />
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
  sliderGroup: {
    width: '100%',
    marginBottom: Spacing.four,
  },
  label: {
    marginBottom: Spacing.two,
  },
  hint: {
    fontSize: 12,
    textAlign: 'left',
  },
});
