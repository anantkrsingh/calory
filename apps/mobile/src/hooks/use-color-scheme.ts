import { useThemeStore } from '@/stores/theme.store';

/**
 * App color scheme from the user's Appearance preference.
 * Auth screens and the rest of the tree all read through this hook.
 */
export function useColorScheme(): 'light' | 'dark' {
  return useThemeStore((s) => s.preference);
}
