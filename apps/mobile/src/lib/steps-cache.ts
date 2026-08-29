import { storage } from '@/lib/storage';

/** Last step count synced to the server for one day, and when that happened —
 * persisted (MMKV) so it survives an app restart, not just in-memory state. */
export interface StepsCacheEntry {
  steps: number;
  /** `Date.now()` epoch millis of the sync, not a server timestamp. */
  updatedAt: number;
}

const keyFor = (date: string): string => `steps:${date}`;

export function readStepsCache(date: string): StepsCacheEntry | null {
  const raw = storage.getString(keyFor(date));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StepsCacheEntry>;
    if (typeof parsed.steps !== 'number' || typeof parsed.updatedAt !== 'number') {
      return null;
    }
    return { steps: parsed.steps, updatedAt: parsed.updatedAt };
  } catch {
    return null;
  }
}

export function writeStepsCache(date: string, steps: number): void {
  const entry: StepsCacheEntry = { steps, updatedAt: Date.now() };
  storage.set(keyFor(date), JSON.stringify(entry));
}
