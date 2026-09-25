import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getNotificationPermissionStatusAsync,
  registerForPushNotificationsAsync,
} from '@/lib/notifications';
import {
  getPermissionChoice,
  setPermissionChoice,
} from '@/lib/permission-preferences';
import { useRegisterPushToken } from '@/queries';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

export type NotificationPermissionPromptState = {
  visible: boolean;
  loading: boolean;
  allow: () => void;
  deny: () => void;
  close: () => void;
};

/**
 * Saves the Expo push token once the user is signed in. If the native
 * permission has not been decided, the hook exposes an app-owned rationale
 * modal state; the native prompt is only requested after Allow is tapped.
 */
export function useRegisterPushNotifications(): NotificationPermissionPromptState {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const registerPushToken = useRegisterPushToken();
  const attemptedRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const registerToken = useCallback(async () => {
    const result = await registerForPushNotificationsAsync();
    if (result) {
      registerPushToken.mutate(result);
    }
  }, [registerPushToken]);

  useEffect(() => {
    if (!isAuthenticated || attemptedRef.current) return;
    attemptedRef.current = true;

    void (async () => {
      const status = await getNotificationPermissionStatusAsync();
      if (status === 'granted') {
        await registerToken();
        return;
      }

      if (status === 'undetermined' && getPermissionChoice('notifications') !== 'denied') {
        setVisible(true);
      }
    })();
    // Runs once per authenticated session; `registerPushToken` is a stable
    // mutation object and re-running on every one of its renders would defeat `attemptedRef`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const allow = useCallback(() => {
    setPermissionChoice('notifications', 'allowed');
    setLoading(true);
    void (async () => {
      await registerToken();
      setLoading(false);
      setVisible(false);
    })();
  }, [registerToken]);

  const deny = useCallback(() => {
    setPermissionChoice('notifications', 'denied');
    setVisible(false);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  return { visible, loading, allow, deny, close };
}
