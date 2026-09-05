import { DEFAULT_DAILY_STEPS_GOAL } from "@/constants/app";
import type { TodayRoutineExercise } from "@fitness/types";
import { useRouter } from "expo-router";
import { Flame, Footprints } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabScreen } from "@/components/tab-screen";
import { ThemedText } from "@/components/themed-text";
import { CircularProgressRing } from "@/components/ui/CircularProgressRing";
import { DaySummarySkeleton } from "@/components/home/DaySummarySkeleton";
import { RoutineGeneratingCard } from "@/components/home/RoutineGeneratingCard";
import { TodayExerciseRow } from "@/components/home/TodayExerciseRow";
import { WeekCaloriesStrip } from "@/components/home/WeekCaloriesStrip";
import {
  WeekProgressSheet,
  type WeekProgressSheetRef,
} from "@/components/home/WeekProgressSheet";
import { Brand, BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useRegisterPushNotifications } from "@/hooks/use-register-push-notifications";
import { useStepsTracker } from "@/hooks/use-steps-tracker";
import { currentWeekDates, todayIsoDate, weekdayName } from "@/lib/date";
import { useTodayQuote } from "@/queries/quotes.queries";
import { useTodayRoutine, useWeekCalories } from "@/queries/workout-routines.queries";

const RING_SIZE = 96;
const RING_STROKE = 12;
const RING_ICON_SIZE = 26;

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const weekProgressSheetRef = useRef<WeekProgressSheetRef>(null);
  const today = useState(todayIsoDate)[0];
  const weekDates = useState(currentWeekDates)[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const isSelectedToday = selectedDate === today;
  const { data: quote, refetch: refetchQuote } = useTodayQuote();
  const {
    data: routine,
    refetch: refetchRoutine,
    isLoading: isRoutineLoading,
  } = useTodayRoutine(selectedDate);
  const { data: weekCalories, refetch: refetchWeekCalories } = useWeekCalories(
    weekDates[0],
    weekDates[6],
  );
  const { steps: liveSteps } = useStepsTracker();

  useRegisterPushNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchQuote(),
        refetchRoutine(),
        refetchWeekCalories(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchQuote, refetchRoutine, refetchWeekCalories]);

  const stepsGoal = routine?.day?.stepsTarget ?? DEFAULT_DAILY_STEPS_GOAL;
  const steps = isSelectedToday ? liveSteps : (routine?.stepsToday ?? 0);
  const burned = routine?.caloriesBurned ?? 0;
  const target = routine?.day?.targetCaloriesBurned ?? 0;
  const exercisesHeading = isSelectedToday
    ? "Today’s Exercises"
    : `${weekdayName(selectedDate)}’s Exercises`;

  // Finished exercises sink to the bottom, otherwise original order is kept.
  const todaysExercises = useMemo(
    () =>
      [...(routine?.exercises ?? [])].sort(
        (a, b) => Number(a.isCompleted) - Number(b.isCompleted),
      ),
    [routine?.exercises],
  );

  const openExercise = useCallback(
    (exercise: TodayRoutineExercise) => {
      router.push({
        pathname: "/exercise/[id]",
        params: { id: exercise.exerciseId },
      });
    },
    [router],
  );

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
            tintColor={Brand.accent}
            colors={[Brand.accent]}
          />
        }>
        {quote ? (
          <View style={styles.quote}>
            <ThemedText type="default" fontWeight="500" style={styles.text}>
              {quote.quoteOfTheDay}
            </ThemedText>
          </View>
        ) : null}

        {routine?.routineStatus === "generating" ? (
          <RoutineGeneratingCard />
        ) : (
          <>
            {weekCalories ? (
              <WeekCaloriesStrip
                days={weekCalories}
                today={today}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            ) : null}

            <View style={styles.dayContent}>
              {isRoutineLoading ? (
                <DaySummarySkeleton />
              ) : (
                <>
                  <View style={styles.ringsRow}>
                    <View
                      style={[
                        styles.ringCard,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}>
                      <CircularProgressRing
                        value={steps}
                        target={stepsGoal}
                        unit="steps"
                        size={RING_SIZE}
                        strokeWidth={RING_STROKE}
                        icon={
                          <Footprints
                            color={Brand.accent}
                            size={RING_ICON_SIZE}
                            strokeWidth={2}
                          />
                        }
                      />
                    </View>
                    <View
                      style={[
                        styles.ringCard,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}>
                      <CircularProgressRing
                        value={burned}
                        target={target}
                        size={RING_SIZE}
                        strokeWidth={RING_STROKE}
                        icon={
                          <Flame
                            color={Brand.accent}
                            size={RING_ICON_SIZE}
                            strokeWidth={2}
                          />
                        }
                      />
                    </View>
                  </View>

                  {routine?.day?.status === "rest" ? (
                    <View style={styles.section}>
                      <ThemedText fontWeight="700" style={styles.sectionTitle}>
                        {exercisesHeading}
                      </ThemedText>
                      <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
                        Rest day — recover and get ready for tomorrow.
                      </ThemedText>
                    </View>
                  ) : null}

                  {todaysExercises.length > 0 ? (
                    <View style={styles.section}>
                      <ThemedText fontWeight="700" style={styles.sectionTitle}>
                        {exercisesHeading}
                      </ThemedText>
                      <View style={styles.list}>
                        {todaysExercises.map((exercise) => (
                          <TodayExerciseRow
                            key={exercise.exerciseId}
                            exercise={exercise}
                            onPress={openExercise}
                          />
                        ))}
                      </View>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <WeekProgressSheet
        ref={weekProgressSheetRef}
        days={weekCalories ?? []}
        today={today}
      />
    </TabScreen>
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
    alignItems: "flex-start",
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  quote: {
    alignSelf: "stretch",
    alignItems: "flex-start",
    gap: Spacing.one,
    maxWidth: "90%",
  },
  text: {
    textAlign: "left",
    fontSize: 18,
    lineHeight: 26,
  },
  dayContent: {
    alignSelf: "stretch",
    gap: Spacing.four,
  },
  ringsRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: Spacing.three,
  },
  ringCard: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth || 1,
    flex: 1,
    padding: Spacing.three,
  },
  section: {
    alignSelf: "stretch",
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    gap: Spacing.two,
  },
});
