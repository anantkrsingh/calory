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
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { http } from '@/api/http';
import { queryClient } from '@/api/query-client';
import { selectHydrated, selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isHydrated = useAuthStore(selectHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

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
    http.setOnUnauthorized(() => queryClient.clear());
    return () => http.setOnUnauthorized(undefined);
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
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>

          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="auth" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
