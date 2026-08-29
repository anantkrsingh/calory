import '@/global.css';

import { Platform } from 'react-native';

/** Default palette — auth and any screen outside `(app)`. */
export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    surface: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    border: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    surface: '#212225',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    border: 'rgba(255, 255, 255, 0.16)',
  },
} as const;

/**
 * Authenticated app shell only (`(app)` layout). Auth screens keep `Colors`.
 * Warm page background + white surfaces (cards, app bar).
 */
export const AppColors = {
  light: {
    ...Colors.light,
    background: '#FAFAF8',
    surface: '#FFFFFF',
    // Elevated chrome (app bar, cards) sits on the warm page bg.
    backgroundElement: '#FFFFFF',
  },
  dark: {
    ...Colors.dark,
    background: '#121210',
    surface: '#1C1C1A',
    backgroundElement: '#242422',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;
export type ThemePalette = Record<ThemeColor, string>;

export const Brand = {
  accent: '#EF5A24',
  teal: '#23B3A6',
  ink: '#1F4E4C',
  cream: '#F7E0B0',
  ctaFill: '#9DC6C5',
  ctaOutline: '#0F0F0F',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 96 }) ?? 0;
export const MaxContentWidth = 800;

export const Pressed = {
  opacity: 0.85,
  transform: [{ scale: 0.99 }],
} as const;
