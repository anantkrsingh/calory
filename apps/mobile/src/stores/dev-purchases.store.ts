import { create } from 'zustand';

interface DevPurchasesState {
  /**
   * Development-only flag to simulate a free-tier user even when Google Play
   * sandbox receipt or RevenueCat cache still has an active test subscription.
   */
  devSimulateFree: boolean;
  setDevSimulateFree: (free: boolean) => void;
  resetDevState: () => void;
}

export const useDevPurchasesStore = create<DevPurchasesState>((set) => ({
  devSimulateFree: false,
  setDevSimulateFree: (devSimulateFree) => set({ devSimulateFree }),
  resetDevState: () => set({ devSimulateFree: false }),
}));
