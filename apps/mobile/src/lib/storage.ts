import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * One MMKV instance for the whole app. Reads and writes are synchronous, which
 * is what lets the request interceptor grab the access token without awaiting.
 */
export const storage = createMMKV({ id: 'fitness.app' });

/** Adapter shape zustand's `persist` middleware expects. */
export const mmkvStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => {
    storage.set(name, value);
  },
  removeItem: (name) => {
    storage.remove(name);
  },
};
