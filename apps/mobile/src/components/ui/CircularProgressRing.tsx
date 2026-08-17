import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { Brand } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type CircularProgressRingProps = {
  value: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  unit?: string;
};

export function CircularProgressRing({
  value,
  target,
  size = 108,
  strokeWidth = 16,
  style,
  unit = "kcal",
}: CircularProgressRingProps) {
  const theme = useTheme();
  const progress = target > 0 ? Math.min(Math.max(value / target, 0), 1) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;

  const label = unit
    ? `${Math.round(value)} / ${Math.round(target)} ${unit}`
    : `${Math.round(value)} / ${Math.round(target)}`;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.backgroundSelected}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={Brand.accent}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
          />
        </G>
      </Svg>

      <View style={styles.label} pointerEvents="none">
        <ThemedText
          type="small"
          fontWeight="500"
          numberOfLines={1}
          style={styles.fraction}
        >
          {label}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  fraction: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
  },
});
