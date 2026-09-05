import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useThemeStore } from '@/stores/theme.store';

/**
 * Web uses the same persisted preference as native, falling back to the
 * system Appearance setting until the user explicitly picks one.
 */
export function useColorScheme(): 'light' | 'dark' {
  const explicitPreference = useThemeStore((s) => s.preference);
  const systemScheme = useSystemColorScheme();
  return explicitPreference ?? (systemScheme === 'dark' ? 'dark' : 'light');
}
