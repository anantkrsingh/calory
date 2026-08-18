import { useThemeStore } from '@/stores/theme.store';

/**
 * Web uses the same persisted preference as native so Appearance toggles match.
 */
export function useColorScheme(): 'light' | 'dark' {
  return useThemeStore((s) => s.preference);
}
