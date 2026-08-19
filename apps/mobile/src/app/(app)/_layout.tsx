import { Stack } from 'expo-router';

import { AppThemeProvider } from '@/hooks/app-theme';

/**
 * Keeps `(app)` a real route the root layout's auth guard can match, and gives
 * non-tab screens (details, modals) a stack that covers the tab bar.
 */
export default function AppLayout() {
  return (
    <AppThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </AppThemeProvider>
  );
}
