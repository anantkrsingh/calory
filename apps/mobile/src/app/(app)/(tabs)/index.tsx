import { StyleSheet, View } from "react-native";

import { TabScreen } from "@/components/tab-screen";
import { ThemedText } from "@/components/themed-text";
import { CircularProgressRing } from "@/components/ui/CircularProgressRing";
import { Spacing } from "@/constants/theme";
import { useTodayQuote } from "@/queries/quotes.queries";
import { useTodayCalories } from "@/queries/workout-routines.queries";

export default function HomeScreen() {
  const { data: quote } = useTodayQuote();
  const { data: calories } = useTodayCalories();

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

      <View style={styles.ringRow}>
        <CircularProgressRing value={burned} target={target} />
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
  ringRow: {
    alignSelf: "stretch",
    width: "50%",
    marginLeft: "50%",
    alignItems: "flex-end",
  },
});
