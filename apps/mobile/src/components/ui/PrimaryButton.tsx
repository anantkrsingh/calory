import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Pressed } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

type PrimaryButtonTone = 'default' | 'danger';

const TONE_COLORS: Record<PrimaryButtonTone, { frame: string; fill: string; text: string }> = {
  default: { frame: Brand.ctaOutline, fill: Brand.ctaFill, text: Brand.ctaOutline },
  danger: { frame: Brand.ctaOutline, fill: Brand.accent, text: '#FFFFFF' },
};

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  tone?: PrimaryButtonTone;
  style?: StyleProp<ViewStyle>;
};

/** The "Get started" pill — an ink frame doubling as the outline around a filled sage disc. */
export default function PrimaryButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  tone = 'default',
  style,
}: PrimaryButtonProps) {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const colors = TONE_COLORS[tone];
  // Both tones share the same near-black ink ring, which reads as nearly
  // invisible against a dark background — swap it for a light ring there.
  const frameColor = isDark ? theme.backgroundSelected : colors.frame;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.frame,
        { backgroundColor: frameColor },
        disabled && styles.disabled,
        pressed && !disabled && Pressed,
        style,
      ]}>
      <View style={[styles.fill, { backgroundColor: colors.fill }]}>
        <ThemedText fontWeight="bold" style={[styles.text, { color: colors.text }]}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 999,
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
  },
  text: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
});
