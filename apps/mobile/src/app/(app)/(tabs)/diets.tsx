import { RotateCw } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/api/errors';
import { DietMealCard } from '@/components/diet/DietMealCard';
import { RoutineGeneratingCard } from '@/components/home/RoutineGeneratingCard';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { todayIsoDate } from '@/lib/date';
import {
  useMarkDietItemsTaken,
  useRegenerateDietPlan,
  useTodayDiet,
} from '@/queries/diet-plans.queries';

export default function DietsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const today = useState(todayIsoDate)[0];

  const { data, isLoading, refetch } = useTodayDiet(today);
  const regenerate = useRegenerateDietPlan();
  const markTaken = useMarkDietItemsTaken();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const createOrRegenerate = useCallback(async () => {
    try {
      await regenerate.mutateAsync();
    } catch (err) {
      Alert.alert(
        'Couldn’t start your plan',
        getErrorMessage(err, 'Something went wrong. Try again.'),
      );
    }
  }, [regenerate]);

  const takenItemIds = useMemo(
    () => new Set(data?.takenItemIds ?? []),
    [data?.takenItemIds],
  );

  const toggleItem = useCallback(
    (mealId: string, itemId: string, taken: boolean) => {
      void markTaken.mutateAsync({ date: today, input: { mealId, itemId, taken } });
    },
    [markTaken, today],
  );

  const toggleMeal = useCallback(
    (mealId: string, taken: boolean) => {
      void markTaken.mutateAsync({ date: today, input: { mealId, taken } });
    },
    [markTaken, today],
  );

  const renderBody = () => {
    if (isLoading && !data) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      );
    }

    if (!data || data.planStatus === null) {
      return (
        <View style={styles.centered}>
          <ThemedText fontWeight="700" style={styles.emptyTitle}>
            No diet plan yet
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
            Your coach can put together a week of meals tailored to your
            goals and macros.
          </ThemedText>
          <PrimaryButton
            label="Create My Diet Plan"
            onPress={() => {
              void createOrRegenerate();
            }}
            disabled={regenerate.isPending}
            style={styles.ctaButton}
          />
        </View>
      );
    }

    if (data.planStatus === 'generating') {
      return (
        <View style={styles.section}>
          <RoutineGeneratingCard />
        </View>
      );
    }

    if (data.planStatus === 'failed') {
      return (
        <View style={styles.centered}>
          <ThemedText fontWeight="700" style={styles.emptyTitle}>
            Couldn’t build your plan
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
            Something went wrong generating your diet plan. Give it another
            try.
          </ThemedText>
          <PrimaryButton
            label="Try Again"
            onPress={() => {
              void createOrRegenerate();
            }}
            disabled={regenerate.isPending}
            style={styles.ctaButton}
          />
        </View>
      );
    }

    if (!data.day || data.day.meals.length === 0) {
      return (
        <View style={styles.centered}>
          <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
            No meals planned for today.
          </ThemedText>
        </View>
      );
    }

    const { day } = data;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText fontWeight="700" style={styles.sectionTitle}>
            Today’s Meals
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Regenerate diet plan"
            hitSlop={8}
            disabled={regenerate.isPending}
            onPress={() => {
              void createOrRegenerate();
            }}
            style={({ pressed }) => [
              styles.regenerateButton,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: regenerate.isPending ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}>
            {regenerate.isPending ? (
              <ActivityIndicator size="small" />
            ) : (
              <RotateCw color={theme.text} size={16} strokeWidth={2.2} />
            )}
          </Pressable>
        </View>

        <View style={[styles.statsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Stat label="Calories" value={`${day.targetCalories}`} />
          <Stat label="Protein" value={`${day.targetProteinG ?? 0}g`} />
          <Stat label="Fat" value={`${day.targetFatG ?? 0}g`} />
          <Stat label="Carbs" value={`${day.targetCarbsG ?? 0}g`} />
        </View>

        <View style={styles.list}>
          {day.meals.map((meal) => (
            <DietMealCard
              key={meal.id}
              meal={meal}
              takenItemIds={takenItemIds}
              onToggleItem={toggleItem}
              onToggleMeal={toggleMeal}
              disabled={markTaken.isPending}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <TabScreen contentStyle={styles.content}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BottomTabInset + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void onRefresh();
            }}
          />
        }>
        {renderBody()}
      </ScrollView>
    </TabScreen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText fontWeight="700" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.statLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  centered: {
    alignItems: 'center',
    gap: Spacing.two,
    justifyContent: 'center',
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.two,
  },
  emptyTitle: {
    fontSize: 20,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  ctaButton: {
    alignSelf: 'stretch',
    marginTop: Spacing.two,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 20,
  },
  regenerateButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth || 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  statsRow: {
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth || 1,
    flexDirection: 'row',
    paddingVertical: Spacing.three,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 12,
  },
  list: {
    gap: Spacing.three,
  },
});
