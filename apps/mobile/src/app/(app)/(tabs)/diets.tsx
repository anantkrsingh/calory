import { useRouter } from 'expo-router';
import { RotateCw } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DietMealCard } from '@/components/diet/DietMealCard';
import { DietMealsSkeleton, DietMetricsSkeleton } from '@/components/diet/DietMealsSkeleton';
import { DietModeSwitcher, type DietMode } from '@/components/diet/DietModeSwitcher';
import { DietWeekSelector } from '@/components/diet/DietWeekSelector';
import { RoutineGeneratingCard } from '@/components/home/RoutineGeneratingCard';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { currentWeekDates, todayIsoDate, weekdayName } from '@/lib/date';
import { useMarkDietItemsTaken, useTodayDiet } from '@/queries/diet-plans.queries';

export default function DietsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const today = useState(todayIsoDate)[0];
  const weekDates = useState(currentWeekDates)[0];

  const [activeMode, setActiveMode] = useState<DietMode>('today');
  // Today always tracks the real today; Metrics and Plan share a day picked
  // from the week selector so flipping between them stays on the same day.
  const [selectedDate, setSelectedDate] = useState(today);
  const displayDate = activeMode === 'today' ? today : selectedDate;

  // Pinned to `today` regardless of tab/day — the plan's status (and so the
  // mode switcher/empty/generating/failed chrome) reads from this one, so
  // switching days in the Plan tab never blanks it out. `useTodayDiet` dedupes
  // by query key, so when `displayDate` is also `today` this is the same
  // cached request as `dayQuery` below, not a second network call.
  const statusQuery = useTodayDiet(today);
  // The day currently on screen — its own loading state is scoped to just
  // the meals list/metrics content (see `DietMealsSkeleton`/`DietMetricsSkeleton`
  // below), never the whole screen.
  const dayQuery = useTodayDiet(displayDate);
  const { data } = dayQuery;
  const markTaken = useMarkDietItemsTaken();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([statusQuery.refetch(), dayQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [statusQuery, dayQuery]);

  // The actual generate call, and the questions behind it, live on their own
  // modal screen (see `(app)/diet-preferences.tsx`) — this just navigates
  // there; its own submit invalidates these queries on success.
  const openPreferences = useCallback(() => {
    router.push('/diet-preferences');
  }, [router]);

  const takenItemIds = useMemo(
    () => new Set(data?.takenItemIds ?? []),
    [data?.takenItemIds],
  );

  const toggleItem = useCallback(
    (mealId: string, itemId: string, taken: boolean) => {
      void markTaken.mutateAsync({ date: displayDate, input: { mealId, itemId, taken } });
    },
    [markTaken, displayDate],
  );

  const toggleMeal = useCallback(
    (mealId: string, taken: boolean) => {
      void markTaken.mutateAsync({ date: displayDate, input: { mealId, taken } });
    },
    [markTaken, displayDate],
  );

  const renderMealsList = (title: string, emptyMessage: string, showRegenerate: boolean) => {
    if (!data?.day || data.day.meals.length === 0) {
      return (
        <View style={styles.centered}>
          <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
            {emptyMessage}
          </ThemedText>
        </View>
      );
    }

    const { day } = data;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText fontWeight="700" style={styles.sectionTitle}>
            {title}
          </ThemedText>
          {showRegenerate ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Regenerate diet plan"
              hitSlop={8}
              onPress={openPreferences}
              style={({ pressed }) => [
                styles.regenerateButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <RotateCw color={theme.text} size={16} strokeWidth={2.2} />
            </Pressable>
          ) : null}
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

  const renderMetrics = () => {
    const { day } = data ?? {};
    if (!day) {
      return (
        <View style={styles.centered}>
          <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
            No targets set for this day.
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={[styles.statsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Stat label="Calories" value={`${day.targetCalories}`} />
        <Stat label="Protein" value={`${day.targetProteinG ?? 0}g`} />
        <Stat label="Fat" value={`${day.targetFatG ?? 0}g`} />
        <Stat label="Carbs" value={`${day.targetCarbsG ?? 0}g`} />
      </View>
    );
  };

  const renderBody = () => {
    const status = statusQuery.data;

    if (statusQuery.isLoading && !status) {
      // Cold start — nothing is known yet, not even whether a plan exists,
      // so there's no chrome to keep on screen around this one.
      return <DietMealsSkeleton />;
    }

    if (!status || status.planStatus === null) {
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
            onPress={openPreferences}
            style={styles.ctaButton}
          />
        </View>
      );
    }

    if (status.planStatus === 'generating') {
      return (
        <View style={styles.section}>
          <RoutineGeneratingCard />
        </View>
      );
    }

    if (status.planStatus === 'failed') {
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
            onPress={openPreferences}
            style={styles.ctaButton}
          />
        </View>
      );
    }

    // Plan is active — the day currently on screen may still be loading
    // (e.g. a day not visited yet this session); scope the shimmer to just
    // that content instead of the chrome above.
    if (activeMode === 'metrics') {
      return data ? renderMetrics() : <DietMetricsSkeleton />;
    }

    if (activeMode === 'plan') {
      return (
        <View style={styles.section}>
          <DietWeekSelector
            days={weekDates}
            today={today}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          {data
            ? renderMealsList(
                `${weekdayName(selectedDate)}’s Meals`,
                'No meals planned for this day.',
                false,
              )
            : <DietMealsSkeleton />}
        </View>
      );
    }

    return data
      ? renderMealsList("Today’s Meals", 'No meals planned for today.', true)
      : <DietMealsSkeleton />;
  };

  // The mode switcher only makes sense once there's an active plan to
  // switch views on — loading/empty/generating/failed states replace the
  // whole screen the same way whichever tab you're on. Reads from the
  // stable `statusQuery` so it never disappears while a day's data reloads.
  const showSwitcher = statusQuery.data?.planStatus === 'active';

  return (
    <TabScreen
      appBar={false}
      header={showSwitcher ? (
        <DietModeSwitcher activeMode={activeMode} onChange={setActiveMode} />
      ) : undefined}
      contentStyle={styles.content}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BottomTabInset + insets.bottom },
          // No header above to take the top inset when the switcher is
          // hidden — take it here instead so content clears the notch.
          !showSwitcher && { paddingTop: insets.top + Spacing.three },
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
