import { Ubuntu_300Light } from '@expo-google-fonts/ubuntu/300Light';
import { Ubuntu_300Light_Italic } from '@expo-google-fonts/ubuntu/300Light_Italic';
import { Ubuntu_400Regular } from '@expo-google-fonts/ubuntu/400Regular';
import { Ubuntu_400Regular_Italic } from '@expo-google-fonts/ubuntu/400Regular_Italic';
import { Ubuntu_500Medium } from '@expo-google-fonts/ubuntu/500Medium';
import { Ubuntu_500Medium_Italic } from '@expo-google-fonts/ubuntu/500Medium_Italic';
import { Ubuntu_700Bold } from '@expo-google-fonts/ubuntu/700Bold';
import { Ubuntu_700Bold_Italic } from '@expo-google-fonts/ubuntu/700Bold_Italic';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { setOnUnauthorized } from '@/api/http';
import { queryClient } from '@/api/query-client';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { selectHydrated, selectIsAuthenticated, selectUser, useAuthStore } from '@/stores/auth.store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isHydrated = useAuthStore(selectHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);
  // A social-login user is authenticated immediately, before onboarding runs —
  // keep the `auth` group (which hosts /auth/onboarding) mounted for them
  // instead of tearing it down the instant `isAuthenticated` flips true.
  const needsOnboarding = isAuthenticated && user !== null && !hasCompletedOnboarding(user);

  // Registered under these exact keys — src/components/ui/Text.tsx maps weights onto them.
  const [fontsLoaded] = useFonts({
    Ubuntu_300Light,
    Ubuntu_300Light_Italic,
    Ubuntu_400Regular,
    Ubuntu_400Regular_Italic,
    Ubuntu_500Medium,
    Ubuntu_500Medium_Italic,
    Ubuntu_700Bold,
    Ubuntu_700Bold_Italic,
  });

  useEffect(() => {
    setOnUnauthorized(() => queryClient.clear());
    return () => setOnUnauthorized(undefined);
  }, []);

  useEffect(() => {
    if (isHydrated && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isHydrated, fontsLoaded]);

  if (!isHydrated || !fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {/* Dark icons on light bg, light icons on dark bg. */}
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={isAuthenticated && !needsOnboarding}>
              <Stack.Screen name="(app)" />
            </Stack.Protected>

            <Stack.Protected guard={!isAuthenticated || needsOnboarding}>
              <Stack.Screen name="auth" />
            </Stack.Protected>
          </Stack>
        </ThemeProvider>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}
