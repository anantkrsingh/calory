import { StyleSheet, View } from "react-native";

import { TabScreen } from "@/components/tab-screen";
import { ThemedText } from "@/components/themed-text";
import { CircularProgressRing } from "@/components/ui/CircularProgressRing";
import { Spacing } from "@/constants/theme";
import { useStepsTracker } from "@/hooks/use-steps-tracker";
import { useTodayQuote } from "@/queries/quotes.queries";
import { useTodayCalories } from "@/queries/workout-routines.queries";

const RING_SIZE = 96;
const RING_STROKE = 12;

export default function HomeScreen() {
  const { data: quote } = useTodayQuote();
  const { data: calories } = useTodayCalories();
  const { steps, goal: stepsGoal } = useStepsTracker();

  const burned = calories?.burned ?? 0;
  const target = calories?.target ?? 0;

  return (
    <TabScreen contentStyle={styles.content}>
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
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "flex-start",
    paddingTop: Spacing.three,
    gap: Spacing.four,
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
});
