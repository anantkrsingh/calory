import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';

type CircleArrowButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  activeColor: string;
  inactiveColor: string;
};

/** Forward-navigation control for step flows — a filled circle with a chevron, right-aligned. */
export default function CircleArrowButton({
  onPress,
  disabled = false,
  accessibilityLabel = 'Next',
  activeColor,
  inactiveColor,
}: CircleArrowButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={8}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: disabled ? inactiveColor : activeColor, opacity: pressed ? 0.85 : 1 },
      ]}>
      <SymbolView
        name="arrow.right"
        size={22}
        weight="semibold"
        tintColor="white"
        fallback={<Text style={styles.fallbackGlyph}>→</Text>}
      />
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
