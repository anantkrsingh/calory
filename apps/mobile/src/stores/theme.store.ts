import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/lib/storage';

export type ColorSchemePreference = 'light' | 'dark';

interface ThemeState {
  /** Explicit in-app override. `null` means the user has never chosen one —
   * a fresh install follows the device's system Appearance setting until
   * they toggle it themselves in Settings. */
  preference: ColorSchemePreference | null;
  hydrated: boolean;
}

interface ThemeActions {
  setPreference: (preference: ColorSchemePreference) => void;
  toggle: () => void;
  setHydrated: () => void;
}

export type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      preference: null,
      hydrated: false,

      setPreference: (preference) => set({ preference }),

      toggle: () =>
        set({
          preference: get().preference === 'dark' ? 'light' : 'dark',
        }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'fitness.theme',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: ({ preference }) => ({ preference }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/** The user's explicit override, or `null` if they've never set one (in
 * which case the app follows the system scheme — see `useColorScheme`). */
export const selectThemePreference = (state: ThemeStore): ColorSchemePreference | null =>
  state.preference;

export const selectThemeHydrated = (state: ThemeStore): boolean => state.hydrated;
