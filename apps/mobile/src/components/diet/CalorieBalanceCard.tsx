import type { CalorieBalance } from '@fitness/types';
import { Flame, Footprints, UtensilsCrossed } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CalorieBalanceCardProps = {
  balance: CalorieBalance;
  targets: {
    targetProteinG?: number | null;
    targetFatG?: number | null;
    targetCarbsG?: number | null;
  };
};

/** Intake against daily targets, macro energy shares, and the day's burn. */
function CalorieBalanceCardComponent({ balance, targets }: CalorieBalanceCardProps) {
  const theme = useTheme();

  const {
    targetCalories,
    consumedCalories,
    burnedFromExercise,
    burnedFromSteps,
    burnedTotal,
    bmr,
    tdee,
    adaptive,
  } = balance;

  const hasTarget = targetCalories !== null && targetCalories > 0;

  const macros = [
    { label: 'Protein', value: balance.consumedProteinG, target: targets.targetProteinG, color: Brand.teal, energyPerGram: 4 },
    { label: 'Fat', value: balance.consumedFatG, target: targets.targetFatG, color: '#D59B28', energyPerGram: 9 },
    { label: 'Carbs', value: balance.consumedCarbsG, target: targets.targetCarbsG, color: '#8B7BE8', energyPerGram: 4 },
  ];
  const totalMacroCalories = macros.reduce((sum, macro) => sum + Math.max(0, macro.value) * macro.energyPerGram, 0);
  const shares = macros.map((macro) => totalMacroCalories > 0
    ? Math.max(0, macro.value) * macro.energyPerGram / totalMacroCalories
    : 0);
  // Largest-remainder rounding keeps the displayed whole percentages at 100%.
  const percentages = shares.map((share) => Math.floor(share * 100));
  if (totalMacroCalories > 0) {
    const remainder = 100 - percentages.reduce((sum, value) => sum + value, 0);
    const order = shares.map((share, index) => ({ index, fraction: share * 100 - percentages[index] }))
      .sort((a, b) => b.fraction - a.fraction);
    for (let index = 0; index < remainder; index += 1) percentages[order[index].index] += 1;
  }
  const circumference = 2 * Math.PI * 48;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.metricsRow}>
        <View style={styles.progressList}>
          <MetricProgress label="Calories" value={consumedCalories} target={targetCalories} unit="kcal" color={Brand.accent} />
          {macros.map((macro) => (
            <MetricProgress key={macro.label} {...macro} unit="g" />
          ))}
        </View>
        <View style={styles.breakdown}>
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={totalMacroCalories > 0
              ? `Consumed macro calorie breakdown: ${macros.map((macro, index) => `${macro.label} ${percentages[index]} percent`).join(', ')}`
              : 'No macros logged yet'}
            style={styles.chart}>
            <Svg width={112} height={112} viewBox="0 0 112 112">
              <Circle cx={56} cy={56} r={48} stroke={theme.backgroundSelected} strokeWidth={12} fill="none" />
              <G rotation={-90} origin="56, 56">
                {macros.map((macro, index) => shares[index] > 0 ? (
                  <Circle
                    key={macro.label}
                    cx={56}
                    cy={56}
                    r={48}
                    stroke={macro.color}
                    strokeWidth={12}
                    fill="none"
                    strokeDasharray={[shares[index] * circumference, circumference * (1 - shares[index])]}
                    strokeDashoffset={-shares.slice(0, index).reduce((sum, share) => sum + share, 0) * circumference}
                  />
                ) : null)}
              </G>
            </Svg>
            <View style={styles.chartCenter} pointerEvents="none">
              <ThemedText fontWeight="700" style={styles.chartValue}>{Math.round(consumedCalories)}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.statLabel}>kcal eaten</ThemedText>
            </View>
          </View>
          {totalMacroCalories > 0 ? macros.map((macro, index) => (
            <View key={macro.label} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: macro.color }]} />
              <ThemedText themeColor="textSecondary" style={styles.statLabel}>{macro.label} {percentages[index]}%</ThemedText>
            </View>
          )) : (
            <ThemedText themeColor="textSecondary" style={styles.statLabel}>No macros yet</ThemedText>
          )}
        </View>
      </View>
      {!hasTarget ? (
        <ThemedText themeColor="textSecondary" style={styles.hint}>
          Add your height, weight, date of birth and sex in your profile to see
          a personalised calorie target.
        </ThemedText>
      ) : null}

      <View style={[styles.stats, { borderTopColor: theme.border }]}>
        <BurnStat
          icon={<UtensilsCrossed size={15} color={theme.textSecondary} />}
          label="Eaten"
          value={`${consumedCalories}`}
        />
        <BurnStat
          icon={<Flame size={15} color={theme.textSecondary} />}
          label="Workouts"
          value={`${burnedFromExercise}`}
        />
        <BurnStat
          icon={<Footprints size={15} color={theme.textSecondary} />}
          label="Steps"
          value={`${burnedFromSteps}`}
        />
      </View>

      {bmr !== null && tdee !== null ? (
        <ThemedText themeColor="textSecondary" style={styles.footnote}>
          BMR {bmr} · TDEE {tdee} · burned {burnedTotal} kcal today
        </ThemedText>
      ) : null}

      {adaptive?.isAdaptive ? (
        <ThemedText themeColor="textSecondary" style={styles.footnote}>
          Measured from {adaptive.daysOfData} days of your own weight and
          intake{trendLabel(adaptive.trendKgPerDay)}.
        </ThemedText>
      ) : null}
    </View>
  );
}

function MetricProgress({ label, value, target, unit, color }: {
  label: string;
  value: number;
  target?: number | null;
  unit: string;
  color: string;
}) {
  const theme = useTheme();
  const hasTarget = target != null && target > 0;
  const progress = hasTarget ? Math.min(Math.max(value / target, 0), 1) : 0;
  const amount = `${Math.round(value)}${hasTarget ? ` / ${Math.round(target)}` : ''} ${unit}`;
  return (
    <View style={styles.metric}>
      <ThemedText fontWeight="600" style={styles.statLabel}>{label}</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.statLabel}>{amount}</ThemedText>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100), text: `${amount}${hasTarget ? '' : ', no target set'}` }}
        style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
      {!hasTarget ? <ThemedText themeColor="textSecondary" style={styles.footnote}>No target set</ThemedText> : null}
    </View>
  );
}

/** kg/day is too small to read; show the weekly rate instead. */
function trendLabel(kgPerDay: number | null): string {
  if (kgPerDay === null) return '';

  const perWeek = kgPerDay * 7;
  if (Math.abs(perWeek) < 0.05) return ', weight holding steady';

  const direction = perWeek < 0 ? 'down' : 'up';
  return `, trending ${direction} ${Math.abs(perWeek).toFixed(2)} kg/week`;
}

function BurnStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statLabelRow}>
        {icon}
        <ThemedText themeColor="textSecondary" style={styles.statLabel}>
          {label}
        </ThemedText>
      </View>
      <ThemedText fontWeight="700" style={styles.statValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.three },
  progressList: { flex: 1, minWidth: 120, gap: Spacing.three },
  metric: { gap: 4 },
  breakdown: { alignItems: 'center', gap: 6 },
  chart: { width: 112, height: 112 },
  chartCenter: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  chartValue: { fontSize: 20 },
  legendRow: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  stat: {
    flex: 1,
    gap: 4,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 16,
  },
  footnote: {
    fontSize: 11,
  },
});

export const CalorieBalanceCard = memo(CalorieBalanceCardComponent);
