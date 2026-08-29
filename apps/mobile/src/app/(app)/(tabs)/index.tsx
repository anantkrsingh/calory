import { DEFAULT_DAILY_STEPS_GOAL } from "@fitness/config";
import type { TodayRoutineExercise } from "@fitness/types";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabScreen } from "@/components/tab-screen";
import { ThemedText } from "@/components/themed-text";
import { CircularProgressRing } from "@/components/ui/CircularProgressRing";
import { TodayExerciseRow } from "@/components/home/TodayExerciseRow";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useStepsTracker } from "@/hooks/use-steps-tracker";
import { todayIsoDate } from "@/lib/date";
import { useTodayQuote } from "@/queries/quotes.queries";
import { useTodayRoutine } from "@/queries/workout-routines.queries";

const RING_SIZE = 96;
const RING_STROKE = 12;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: quote } = useTodayQuote();
  const { data: routine } = useTodayRoutine(todayIsoDate());
  const { steps } = useStepsTracker();

  const stepsGoal = routine?.day?.stepsTarget ?? DEFAULT_DAILY_STEPS_GOAL;
  const burned = routine?.caloriesBurned ?? 0;
  const target = routine?.day?.targetCaloriesBurned ?? 0;

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
        showsVerticalScrollIndicator={false}>
        {quote ? (
          <View style={styles.quote}>
            <ThemedText type="default" fontWeight="500" style={styles.text}>
              {quote.quoteOfTheDay}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.ringsRow}>
          <CircularProgressRing
            value={steps}
            target={stepsGoal}
            unit="steps"
            size={RING_SIZE}
            strokeWidth={RING_STROKE}
          />
          <CircularProgressRing
            value={burned}
            target={target}
            size={RING_SIZE}
            strokeWidth={RING_STROKE}
          />
        </View>

        {routine?.day?.status === "rest" ? (
          <View style={styles.section}>
            <ThemedText fontWeight="700" style={styles.sectionTitle}>
              Today’s Exercises
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
              Rest day — recover and get ready for tomorrow.
            </ThemedText>
          </View>
        ) : null}

        {todaysExercises.length > 0 ? (
          <View style={styles.section}>
            <ThemedText fontWeight="700" style={styles.sectionTitle}>
              Today’s Exercises
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
      </ScrollView>
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
  ringsRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
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
