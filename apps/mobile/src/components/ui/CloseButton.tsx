import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

type CloseButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
};

/**
 * Mirrors UIKit's `UIButton.Configuration.close`: a 30pt translucent grey disc
 * with a bold `xmark` glyph, parked in the top-left of the screen.
 */
export default function CloseButton({
  onPress,
  accessibilityLabel = 'Close',
}: CloseButtonProps) {
  const isDark = useColorScheme() === 'dark';

  // UIKit `systemFill` / `secondaryLabel` — the exact tints iOS uses for this button.
  const backgroundColor = isDark ? 'rgba(120, 120, 128, 0.36)' : 'rgba(120, 120, 128, 0.16)';
  const glyphColor = isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor }, pressed && styles.pressed]}>
      <SymbolView
        name="xmark"
        size={13}
        weight="bold"
        tintColor={glyphColor}
        fallback={<Text style={[styles.fallbackGlyph, { color: glyphColor }]}>✕</Text>}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackGlyph: {
    fontSize: 15,
    lineHeight: Platform.OS === 'android' ? 17 : 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
});
