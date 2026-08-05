import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

type CloseButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
};

/**
 * Mirrors UIKit's `UIButton.Configuration.close`: a translucent grey disc
 * with a bold `xmark` glyph, parked in the top-left of the screen.
 */
export default function CloseButton({
  onPress,
  accessibilityLabel = 'Close',
}: CloseButtonProps) {
  const isDark = useColorScheme() === 'dark';

  // Pure white disc in light mode (needs a shadow to lift off a white page); the
  // translucent UIKit `systemFill` tint in dark mode, with a heavier shadow to match.
  const backgroundColor = isDark ? 'rgba(120, 120, 128, 0.36)' : '#FFFFFF';
  const glyphColor = isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        isDark ? styles.darkShadow : styles.lightShadow,
        pressed && styles.pressed,
      ]}>
      <SymbolView
        name="xmark"
        size={16}
        weight="bold"
        tintColor={glyphColor}
        fallback={<Text style={[styles.fallbackGlyph, { color: glyphColor }]}>✕</Text>}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackGlyph: {
    fontSize: 18,
    lineHeight: Platform.OS === 'android' ? 20 : 18,
    fontWeight: '600',
  },
  lightShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  darkShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  pressed: {
    opacity: 0.6,
  },
});
