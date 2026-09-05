import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useThemeStore } from '@/stores/theme.store';

/**
 * Effective app color scheme: the user's explicit in-app choice if they've
 * ever set one (Settings → Dark mode), otherwise the device's system
 * Appearance setting — so a fresh install matches system light/dark until
 * the user overrides it. Auth screens and the rest of the tree all read
 * through this hook.
 */
export function useColorScheme(): 'light' | 'dark' {
  const explicitPreference = useThemeStore((s) => s.preference);
  const systemScheme = useSystemColorScheme();
  return explicitPreference ?? (systemScheme === 'dark' ? 'dark' : 'light');
}
