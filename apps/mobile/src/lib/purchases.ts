import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const API_KEYS: Partial<Record<typeof Platform.OS, string | undefined>> = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
};

let configured = false;

/**
 * Configures the RevenueCat SDK. Safe to call more than once — only the
 * first call takes effect. No-ops on web and on platforms without a key
 * configured for this build.
 */
export function configurePurchases(): void {
  if (configured) return;

  const apiKey = API_KEYS[Platform.OS];
  if (!apiKey) return;

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey });
  configured = true;
}

/**
 * Ties the RevenueCat identity to our own auth session: call with the
 * signed-in user's id on login, and with `null` on logout so entitlements
 * don't leak into the next anonymous/device session.
 */
export async function syncPurchasesUser(userId: string | null): Promise<void> {
  if (!configured) return;

  try {
    if (userId) {
      await Purchases.logIn(userId);
    } else {
      await Purchases.logOut();
    }
  } catch (error) {
    // logOut() rejects if the SDK is already on an anonymous id (e.g. two
    // logouts in a row) — entitlements aren't affected either way, so this
    // must not block the app's own sign-out flow.
    if (__DEV__) console.warn('[purchases] identity sync failed', error);
  }
}
