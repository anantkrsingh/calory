import type { ReactNode } from "react";
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
  /** Rendered centered inside the ring, e.g. a Flame or Footprints icon. */
  icon?: ReactNode;
};

export function CircularProgressRing({
  value,
  target,
  size = 108,
  strokeWidth = 16,
  style,
  unit = "kcal",
  icon,
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
    <View style={[styles.container, style]}>
      <View style={{ width: size, height: size }}>
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

        {icon ? (
          <View style={styles.iconOverlay} pointerEvents="none">
            {icon}
          </View>
        ) : null}
      </View>

      {/* Below the ring, not crammed inside it — the ring's own diameter was
          too narrow for this text at any reasonable font size. */}
      <ThemedText
        type="small"
        fontWeight="500"
        numberOfLines={1}
        style={styles.fraction}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  iconOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  fraction: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
    textAlign: "center",
  },
});
