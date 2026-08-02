import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { http } from '@/api/http';
import { queryClient } from '@/api/query-client';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // A failed refresh has already cleared the auth store; drop the cache too so
    // the next session never renders the previous user's data.
    http.setOnUnauthorized(() => queryClient.clear());
    return () => http.setOnUnauthorized(undefined);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppTabs />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
