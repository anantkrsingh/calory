import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/lib/storage';

export type ColorSchemePreference = 'light' | 'dark';

interface ThemeState {
  /** Explicit app theme. Defaults to light until the user toggles. */
  preference: ColorSchemePreference;
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
      preference: 'light',
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

export const selectThemePreference = (state: ThemeStore): ColorSchemePreference =>
  state.preference;

export const selectIsDarkMode = (state: ThemeStore): boolean =>
  state.preference === 'dark';

export const selectThemeHydrated = (state: ThemeStore): boolean => state.hydrated;
