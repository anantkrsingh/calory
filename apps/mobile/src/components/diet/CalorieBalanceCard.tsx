import type { CalorieBalance } from '@fitness/types';
import { Flame, Footprints, UtensilsCrossed } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CalorieBalanceCardProps = {
  balance: CalorieBalance;
};

/** Today's real energy balance: what was actually eaten against the computed
 * target, plus where the day's burn came from. Sits above the plan's macro
 * targets on the Metrics tab — targets are the plan, this is the reality. */
function CalorieBalanceCardComponent({ balance }: CalorieBalanceCardProps) {
  const theme = useTheme();

  const {
    targetCalories,
    consumedCalories,
    remainingCalories,
    burnedFromExercise,
    burnedFromSteps,
    burnedTotal,
    bmr,
    tdee,
  } = balance;

  const hasTarget = targetCalories !== null && targetCalories > 0;
  const progress = hasTarget
    ? Math.min(consumedCalories / targetCalories, 1)
    : 0;
  const overTarget = hasTarget && consumedCalories > targetCalories;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.headline}>
        <ThemedText fontWeight="700" style={styles.eaten}>
          {consumedCalories}
          <ThemedText themeColor="textSecondary" style={styles.eatenUnit}>
            {hasTarget ? ` / ${targetCalories} kcal` : ' kcal eaten'}
          </ThemedText>
        </ThemedText>

        {remainingCalories !== null ? (
          <ThemedText themeColor="textSecondary" style={styles.remaining}>
            {overTarget
              ? `${consumedCalories - (targetCalories ?? 0)} over`
              : `${remainingCalories} left`}
          </ThemedText>
        ) : null}
      </View>

      {hasTarget ? (
        <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${progress * 100}%`,
                backgroundColor: overTarget ? Brand.teal : Brand.accent,
              },
            ]}
          />
        </View>
      ) : (
        <ThemedText themeColor="textSecondary" style={styles.hint}>
          Add your height, weight, date of birth and sex in your profile to see
          a personalised calorie target.
        </ThemedText>
      )}

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
    </View>
  );
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
  headline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  eaten: {
    fontSize: 26,
  },
  eatenUnit: {
    fontSize: 14,
  },
  remaining: {
    fontSize: 13,
  },
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
