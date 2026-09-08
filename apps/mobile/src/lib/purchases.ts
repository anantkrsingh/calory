import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';

const API_KEYS: Partial<Record<typeof Platform.OS, string | undefined>> = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
};

/**
 * Master switch for the whole in-app-purchases surface — RevenueCat init,
 * every Pro/paywall screen and upsell. Defaults on; set
 * `EXPO_PUBLIC_IAP_ENABLED=false` (a build without a store-review-ready
 * paywall, a flavor with no monetization, etc.) to turn it off everywhere
 * without touching call sites — they all read this flag or the `configured`
 * state it gates below.
 */
export const IAP_ENABLED = process.env.EXPO_PUBLIC_IAP_ENABLED !== 'false';

/** Entitlement identifier configured in the RevenueCat dashboard — every
 * "is this user Pro?" check in the app goes through this one constant. */
export const ENTITLEMENT_ID = 'pro';

let configured = false;

/**
 * Configures the RevenueCat SDK. Safe to call more than once — only the
 * first call takes effect. No-ops when `IAP_ENABLED` is false, on web, and
 * on platforms without a key configured for this build. Every native call
 * is wrapped in a try/catch: this used to run unguarded and a bad key /
 * unavailable native module took the whole app down with it, so nothing
 * here may throw synchronously.
 */
export function configurePurchases(): void {
  if (configured || !IAP_ENABLED) return;

  const apiKey = API_KEYS[Platform.OS];
  if (!apiKey) return;

  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey });
    configured = true;
  } catch (error) {
    if (__DEV__) console.warn('[purchases] configure failed', error);
  }
}

/** Whether `configurePurchases` has actually taken effect — the fetch/entitlement
 * helpers below all no-op instead of throwing when this is false. */
export function isPurchasesConfigured(): boolean {
  return configured;
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

/** The current offering's packages (weekly/monthly/annual, whatever's set up
 * in the dashboard). `null` when unconfigured, offline, or misconfigured —
 * callers should treat that as "plans unavailable", not an error to surface. */
export async function fetchOfferings(): Promise<PurchasesOfferings | null> {
  if (!configured) return null;

  try {
    return await Purchases.getOfferings();
  } catch (error) {
    if (__DEV__) console.warn('[purchases] getOfferings failed', error);
    return null;
  }
}

/** The signed-in user's entitlements. `null` under the same conditions as
 * `fetchOfferings` — callers should read that as "unknown", not "not Pro". */
export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;

  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    if (__DEV__) console.warn('[purchases] getCustomerInfo failed', error);
    return null;
  }
}

/** Buys a package. Left to reject on failure (including user cancellation,
 * `error.userCancelled`) — the caller is in a better position to decide what
 * the UI should do about each. */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

/** Restores whatever purchases the store has on file for this account. */
export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

/** `true` once `ENTITLEMENT_ID` is active on the given customer info. Treats
 * `null`/`undefined` (not loaded yet, or RevenueCat unavailable) as not Pro. */
export function hasActiveEntitlement(info: CustomerInfo | null | undefined): boolean {
  return Boolean(info?.entitlements.active[ENTITLEMENT_ID]);
}
