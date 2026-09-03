import type { Exercise } from '@fitness/types';
import { create } from 'zustand';

export interface ExerciseSetTiming {
  /** Epoch ms — when Start was pressed. */
  startedAt: number;
  /** Epoch ms — when Stop was pressed. */
  stoppedAt: number;
  durationSec: number;
}

interface PendingLog {
  exercise: Exercise;
  timing: ExerciseSetTiming;
}

interface ExerciseTimerState {
  /** Set while a set is being timed — drives the floating bar in `(app)/_layout`,
   * visible over every screen, not just the one Start was pressed from. */
  exercise: Exercise | null;
  /** Epoch ms. */
  startedAt: number | null;
  /** Set once Stop is pressed, until `LogSetSheet` is closed — also rendered
   * globally, since Stop can happen from a different screen than Start. */
  pendingLog: PendingLog | null;
}

interface ExerciseTimerActions {
  start: (exercise: Exercise) => void;
  /** No-ops if nothing is running. */
  stop: () => void;
  clearPendingLog: () => void;
}

export type ExerciseTimerStore = ExerciseTimerState & ExerciseTimerActions;

/**
 * Not persisted — a running set timer intentionally doesn't survive an app
 * restart, same as any other in-memory session state.
 */
export const useExerciseTimerStore = create<ExerciseTimerStore>()(
  (set, get) => ({
    exercise: null,
    startedAt: null,
    pendingLog: null,

    start: (exercise) =>
      set({ exercise, startedAt: Date.now(), pendingLog: null }),

    stop: () => {
      const { exercise, startedAt } = get();
      if (!exercise || !startedAt) return;

      const stoppedAt = Date.now();
      const durationSec = Math.max(
        1,
        Math.round((stoppedAt - startedAt) / 1000),
      );

      set({
        exercise: null,
        startedAt: null,
        pendingLog: { exercise, timing: { startedAt, stoppedAt, durationSec } },
      });
    },

    clearPendingLog: () => set({ pendingLog: null }),
  }),
);

export const selectIsExerciseTimerRunning = (
  state: ExerciseTimerStore,
): boolean => state.exercise !== null;
