import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { Brand, Pressed } from '@/constants/theme';

type RingProps = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** Ring/frame background color. @default Brand.ctaOutline */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/** The ink-frame pill technique — a padded, colored outer frame standing in for a border. */
export default function Ring({ children, onPress, disabled = false, color = Brand.ctaOutline, style }: RingProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.frame,
        { backgroundColor: color },
        disabled && styles.disabled,
        pressed && !disabled && Pressed,
        style,
      ]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 999,
    padding: 1,
    paddingBottom: 4,
    paddingHorizontal: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
