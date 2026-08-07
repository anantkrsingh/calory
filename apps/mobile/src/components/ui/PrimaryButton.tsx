import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Pressed } from '@/constants/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** The "Get started" pill — an ink frame doubling as the outline around a filled sage disc. */
export default function PrimaryButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.frame,
        disabled && styles.disabled,
        pressed && !disabled && Pressed,
        style,
      ]}>
      <View style={styles.fill}>
        <ThemedText fontWeight="bold" style={styles.text}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 999,
    backgroundColor: Brand.ctaOutline,
    padding: 3,
    paddingBottom: 6,
    paddingHorizontal: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  fill: {
    height: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.ctaFill,
  },
  text: {
    color: Brand.ctaOutline,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
});
