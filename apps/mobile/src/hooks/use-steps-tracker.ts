import { DEFAULT_DAILY_STEPS_GOAL } from '@fitness/config';
import { Pedometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { todayIsoDate } from '@/lib/date';
import { readStepsCache, writeStepsCache } from '@/lib/steps-cache';
import { useDailySteps, useUpsertSteps } from '@/queries/steps.queries';

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// iOS can answer "how many steps since midnight" directly, so re-asking every
// minute is enough to feel live without hammering CoreMotion.
const IOS_POLL_MS = 60_000;
// Debounce before persisting a moving count server-side, and how long the app
// can sit in the background before we treat a resumed session as stale.
const SYNC_DEBOUNCE_MS = 5_000;
// On reopen, only force a sync if the last one is at least this old.
const RESYNC_STALE_MS = 60_000;

export type StepsTrackerState = {
  /** Live device count once available; the last synced server value until then. */
  steps: number;
  goal: number;
  /** True once `steps` is a live on-device reading, not just the last sync. */
  isLive: boolean;
  permissionDenied: boolean;
};

/**
 * Reads today's step count from the device pedometer and keeps it synced to
 * the server. iOS answers a direct "steps since midnight" query; Android's
 * sensor only reports a delta from the moment you start listening, so there
 * we add that delta on top of the last count the server already has.
 *
 * Synced values are also cached locally, so a cold start can paint instantly.
 */
export function useStepsTracker(): StepsTrackerState {
  const [date] = useState(todayIsoDate);
  const server = useDailySteps(date);
  const upsertSteps = useUpsertSteps();

  const [liveSteps, setLiveSteps] = useState<number | null>(
    () => readStepsCache(date)?.steps ?? null,
  );
  const [permissionDenied, setPermissionDenied] = useState(false);

  const lastSyncedRef = useRef<number | null>(readStepsCache(date)?.steps ?? null);

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSync = (steps: number) => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    if (lastSyncedRef.current === steps) return;
    lastSyncedRef.current = steps;
    writeStepsCache(date, steps);
    upsertSteps.mutate({ date, steps });
  };

  const scheduleSync = (steps: number) => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => flushSync(steps), SYNC_DEBOUNCE_MS);
  };

  // Flush on backgrounding; on reopen, force a sync if the reading moved on.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (liveSteps === null) return;
        const cached = readStepsCache(date);
        const stale = !cached || Date.now() - cached.updatedAt > RESYNC_STALE_MS;
        if (stale && liveSteps !== (cached?.steps ?? null)) flushSync(liveSteps);
      } else if (liveSteps !== null) {
        flushSync(liveSteps);
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flushSync closes over refs, not state
  }, [liveSteps, date]);

  useEffect(() => {
    // Only start watching once we know the server's existing total for
    // today — Android's baseline math needs it before the first reading.
    if (!server.isSuccess) return;

    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | null = null;
    let subscription: { remove: () => void } | null = null;

    const start = async () => {
      const available = await Pedometer.isAvailableAsync().catch(() => false);
      if (cancelled || !available) return;

      const permission = await Pedometer.requestPermissionsAsync();
      if (cancelled) return;
      if (!permission.granted) {
        setPermissionDenied(true);
        return;
      }

      if (Platform.OS === 'ios') {
        const readToday = async () => {
          try {
            const result = await Pedometer.getStepCountAsync(startOfToday(), new Date());
            if (!cancelled) {
              setLiveSteps(result.steps);
              scheduleSync(result.steps);
            }
          } catch {
            // Sensor hiccup — next poll tick tries again.
          }
        };
        void readToday();
        pollId = setInterval(() => void readToday(), IOS_POLL_MS);
        return;
      }

      // Android: `watchStepCount` reports a delta from subscribe-time, so
      // today's total is that delta layered on top of what's already saved.
      const baseline = server.data?.steps ?? 0;
      subscription = Pedometer.watchStepCount((result) => {
        if (cancelled) return;
        const total = baseline + result.steps;
        setLiveSteps(total);
        scheduleSync(total);
      });
    };

    void start();

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
      subscription?.remove();
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- baseline is read once per mount, not reactive
  }, [server.isSuccess]);

  return {
    steps: liveSteps ?? server.data?.steps ?? 0,
    goal: server.data?.goal ?? DEFAULT_DAILY_STEPS_GOAL,
    isLive: liveSteps !== null,
    permissionDenied,
  };
}
