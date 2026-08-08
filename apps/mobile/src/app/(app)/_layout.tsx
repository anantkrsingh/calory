import { Stack } from 'expo-router';

/**
 * Keeps `(app)` a real route the root layout's auth guard can match, and gives
 * non-tab screens (details, modals) a stack that covers the tab bar.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
