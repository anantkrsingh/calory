import '@/polyfills';

import { Ubuntu_300Light } from "@expo-google-fonts/ubuntu/300Light";
import { Ubuntu_300Light_Italic } from "@expo-google-fonts/ubuntu/300Light_Italic";
import { Ubuntu_400Regular } from "@expo-google-fonts/ubuntu/400Regular";
import { Ubuntu_400Regular_Italic } from "@expo-google-fonts/ubuntu/400Regular_Italic";
import { Ubuntu_500Medium } from "@expo-google-fonts/ubuntu/500Medium";
import { Ubuntu_500Medium_Italic } from "@expo-google-fonts/ubuntu/500Medium_Italic";
import { Ubuntu_700Bold } from "@expo-google-fonts/ubuntu/700Bold";
import { Ubuntu_700Bold_Italic } from "@expo-google-fonts/ubuntu/700Bold_Italic";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { setOnUnauthorized } from "@/api/http";
import { queryClient } from "@/api/query-client";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { hasCompletedOnboarding } from "@/lib/onboarding";
// RevenueCat is disabled for now — no API keys configured, and initializing
// it was crashing production. Re-enable once EXPO_PUBLIC_REVENUECAT_*_API_KEY
// are set. Package stays in package.json; only this wiring is disabled.
// import { configurePurchases, syncPurchasesUser } from "@/lib/purchases";
import {
  selectHydrated,
  selectIsAuthenticated,
  selectUser,
  useAuthStore,
} from "@/stores/auth.store";
import { selectThemeHydrated, useThemeStore } from "@/stores/theme.store";

SplashScreen.preventAutoHideAsync();
// configurePurchases(); // disabled — see import comment above

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isHydrated = useAuthStore(selectHydrated);
  const isThemeHydrated = useThemeStore(selectThemeHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);
  const needsOnboarding =
    isAuthenticated && user !== null && !hasCompletedOnboarding(user);

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

  // useEffect(() => {
  //   if (!isHydrated) return;
  //   syncPurchasesUser(isAuthenticated ? (user?.id ?? null) : null);
  // }, [isHydrated, isAuthenticated, user?.id]);

  useEffect(() => {
    if (isHydrated && isThemeHydrated && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isHydrated, isThemeHydrated, fontsLoaded]);

  if (!isHydrated || !isThemeHydrated || !fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
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
    </GestureHandlerRootView>
  );
}
