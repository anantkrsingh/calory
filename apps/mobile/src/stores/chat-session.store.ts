import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/lib/storage';

interface ChatSessionState {
  activeConversationId: string | null;
  hydrated: boolean;
}

interface ChatSessionActions {
  setActiveConversationId: (id: string | null) => void;
  setHydrated: () => void;
}

export type ChatSessionStore = ChatSessionState & ChatSessionActions;

/** Remembers which coach thread the Chat tab should show. */
export const useChatSessionStore = create<ChatSessionStore>()(
  persist(
    (set) => ({
      activeConversationId: null,
      hydrated: false,

      setActiveConversationId: (activeConversationId) =>
        set({ activeConversationId }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'fitness.chat-session',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: ({ activeConversationId }) => ({ activeConversationId }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

export const selectActiveConversationId = (
  state: ChatSessionStore,
): string | null => state.activeConversationId;

export const selectChatSessionHydrated = (
  state: ChatSessionStore,
): boolean => state.hydrated;
