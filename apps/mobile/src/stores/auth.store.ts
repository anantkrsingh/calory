import type { AuthSession, AuthTokens, User } from '@fitness/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/lib/storage';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  /** False until the persisted slice has been read back off MMKV. */
  hydrated: boolean;
}

interface AuthActions {
  setSession: (session: AuthSession) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setUser: (user: User | null) => void;
  setHydrated: () => void;
  clear: () => void;
}

export type AuthStore = AuthState & AuthActions;

/**
 * Holds the session. `HttpClient` reads tokens straight off this store, so it
 * is the single source of truth for "am I signed in" across screens and calls.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      hydrated: false,

      setSession: (session) =>
        set({ user: session.user, tokens: session.tokens }),

      setTokens: (tokens) => set({ tokens }),

      setUser: (user) => set({ user }),

      setHydrated: () => set({ hydrated: true }),

      clear: () => set({ user: null, tokens: null }),
    }),
    {
      name: 'fitness.auth',
      storage: createJSONStorage(() => mmkvStorage),
      // Only the data slice is persisted — `hydrated` is runtime-only, and
      // writing it back would freeze the flag at false on the next launch.
      partialize: ({ user, tokens }) => ({ user, tokens }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/** Non-reactive access, for interceptors and other callers outside React. */
export const authState = {
  get: () => useAuthStore.getState(),
  tokens: () => useAuthStore.getState().tokens,
  setSession: (session: AuthSession) =>
    useAuthStore.getState().setSession(session),
  setTokens: (tokens: AuthTokens | null) =>
    useAuthStore.getState().setTokens(tokens),
  clear: () => useAuthStore.getState().clear(),
};

export const selectUser = (state: AuthStore): User | null => state.user;

export const selectIsAuthenticated = (state: AuthStore): boolean =>
  Boolean(state.tokens?.accessToken);

export const selectHydrated = (state: AuthStore): boolean => state.hydrated;
