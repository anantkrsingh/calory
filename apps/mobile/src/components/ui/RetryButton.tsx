import { RotateCw } from 'lucide-react-native';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Brand, Pressed } from '@/constants/theme';

type RetryButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Circular icon-only control for error states — swaps a "Retry" label for a refresh glyph. */
export default function RetryButton({
  onPress,
  accessibilityLabel = 'Retry',
  style,
}: RetryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: Brand.accent },
        pressed && Pressed,
        style,
      ]}>
      <RotateCw color="#FFFFFF" size={20} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
});
