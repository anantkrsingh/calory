import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

import { ThemedText } from "@/components/themed-text";
import { Brand, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface SegmentedProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

/** One track per step; fills left-to-right as `currentStep` advances past it. */
function Segment({ filled, trackColor }: { filled: boolean; trackColor: string }) {
  const progress = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(filled ? 1 : 0, { duration: 280 });
  }, [filled, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

export default function SegmentedProgressBar({
  currentStep,
  totalSteps,
}: SegmentedProgressBarProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <Segment
            key={index}
            filled={index < currentStep}
            trackColor={theme.backgroundElement}
          />
        ))}
      </View>
      <ThemedText type="small" style={styles.label}>
        Step {currentStep} of {totalSteps}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  row: {
    flexDirection: "row",
    width: "100%",
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  label: {
    textAlign: "left",
  },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: Brand.accent,
  },
});
