import { Stack } from 'expo-router';

import { GlobalTimerBar } from '@/components/exercise/GlobalTimerBar';
import { LogSetSheet } from '@/components/exercise/LogSetSheet';
import { AppThemeProvider } from '@/hooks/app-theme';

/**
 * Keeps `(app)` a real route the root layout's auth guard can match, and gives
 * non-tab screens (details, modals) a stack that covers the tab bar.
 *
 * `GlobalTimerBar` and `LogSetSheet` are mounted here — once, above every
 * screen this Stack renders — rather than on the exercise detail screen, so
 * a running set timer (and the Stop → log-set flow that follows it) survives
 * navigating away from the exercise it was started on.
 */
export default function AppLayout() {
  return (
    <AppThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="chat/history"
          options={{ animation: 'slide_from_left', presentation: 'card' }}
        />
        <Stack.Screen name="chat/[id]" options={{ animation: 'fade' }} />
      </Stack>

      <GlobalTimerBar />
      <LogSetSheet />
    </AppThemeProvider>
  );
}
