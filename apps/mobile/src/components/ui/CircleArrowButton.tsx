import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

type CircleArrowButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  /** Shows a spinner instead of the arrow and blocks interaction, without dimming to inactiveColor. */
  loading?: boolean;
  accessibilityLabel?: string;
  activeColor: string;
  inactiveColor: string;
};

/** Forward-navigation control for step flows — a filled circle with a chevron, right-aligned. */
export default function CircleArrowButton({
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel = 'Next',
  activeColor,
  inactiveColor,
}: CircleArrowButtonProps) {
  const interactionDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: interactionDisabled, busy: loading }}
      hitSlop={8}
      onPress={onPress}
      disabled={interactionDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: disabled ? inactiveColor : activeColor, opacity: pressed ? 0.85 : 1 },
      ]}>
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <SymbolView
          name="arrow.right"
          size={22}
          weight="semibold"
          tintColor="white"
          fallback={<Text style={styles.fallbackGlyph}>→</Text>}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackGlyph: {
    color: 'white',
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '600',
  },
});
