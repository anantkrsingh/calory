import { Colors } from '@/constants/theme';
import { useAppThemeOverride } from '@/hooks/app-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const override = useAppThemeOverride();
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;

  return override ?? Colors[theme === 'dark' ? 'dark' : 'light'];
}
