import { useEffect, useRef } from 'react';

import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { useRegisterPushToken } from '@/queries';
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth.store';

/**
 * Prompts for notification permission (if not already decided) and saves the
 * Expo push token once the user is signed in. Mount this on the screen that
 * should trigger it — currently the home tab, the first screen a signed-in
 * user lands on. Runs at most once per app session; a decline or a missing
 * token is silently skipped, never retried until the app restarts.
 */
export function useRegisterPushNotifications(): void {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const registerPushToken = useRegisterPushToken();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || attemptedRef.current) return;
    attemptedRef.current = true;

    void (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        registerPushToken.mutate({ token });
      }
    })();
    // Runs once per authenticated session; `registerPushToken` is a stable
    // mutation object and re-running on every one of its renders would defeat `attemptedRef`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
}
