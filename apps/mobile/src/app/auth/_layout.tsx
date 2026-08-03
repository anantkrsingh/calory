import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export const unstable_settings = {
  anchor: 'welcome',
};

export default function AuthLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="create-password" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="google-login" />
    </Stack>
  );
}
