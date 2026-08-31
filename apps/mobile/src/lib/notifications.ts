import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ANDROID_CHANNEL_ID = 'default';

// Foreground notifications still surface a banner while the app is open.
Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
});

let androidChannelReady = false;

/**
 * Android 13+ won't show the permission prompt until at least one channel
 * exists, so this has to run before `requestPermissionsAsync`.
 */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || androidChannelReady) return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  androidChannelReady = true;
}

/**
 * Asks for notification permission if it hasn't been decided yet, then
 * resolves to the device's Expo push token. Resolves `null` — never
 * throws — on web, on a simulator/emulator (Expo push tokens don't exist
 * there), or if the permission prompt is declined.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  try {
    await ensureAndroidChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let status = existingStatus;

    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }

    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as
      | string
      | undefined;
    if (!projectId) {
      if (__DEV__) {
        console.warn('[notifications] missing extra.eas.projectId, cannot fetch a push token');
      }
      return null;
    }

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (error) {
    if (__DEV__) console.warn('[notifications] registration failed', error);
    return null;
  }
}

/**
 * Reads the device's current push token without prompting, for use at
 * logout — nothing to unregister if permission was never granted.
 */
export async function getCurrentPushTokenAsync(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as
      | string
      | undefined;
    if (!projectId) return null;

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}
