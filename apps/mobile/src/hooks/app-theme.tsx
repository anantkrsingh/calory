import { createContext, useContext, type PropsWithChildren } from 'react';

import { AppColors, type ThemePalette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AppThemeContext = createContext<ThemePalette | null>(null);

/** Provides `AppColors` to everything under the authenticated `(app)` tree. */
export function AppThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const theme = AppColors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <AppThemeContext.Provider value={theme}>{children}</AppThemeContext.Provider>
  );
}

export function useAppThemeOverride(): ThemePalette | null {
  return useContext(AppThemeContext);
}
