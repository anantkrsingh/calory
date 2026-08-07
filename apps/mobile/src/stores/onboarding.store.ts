import type { Sex, ActivityLevel, UnitSystem } from '@fitness/types';
import { create } from 'zustand';

interface OnboardingUserData {
  email: string;
  displayName: string;
  phone?: string;
  dateOfBirth?: string;
  sex?: Sex;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  fitnessGoals?: string[];
  unitSystem?: UnitSystem;
}

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  userData: OnboardingUserData;
  isVerified: boolean;
  verificationCode: string;
  isLoading: boolean;
  error: string | null;
}

interface OnboardingActions {
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  updateUserData: (data: Partial<OnboardingUserData>) => void;
  setVerified: (verified: boolean) => void;
  setVerificationCode: (code: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetOnboarding: () => void;
}

export type OnboardingStore = OnboardingState & OnboardingActions;

const TOTAL_STEPS = 7;

const INITIAL_USER_DATA: OnboardingUserData = {
  email: '',
  displayName: '',
  phone: '',
  dateOfBirth: '',
  sex: undefined,
  heightCm: undefined,
  weightKg: undefined,
  activityLevel: undefined,
  fitnessGoals: [],
  unitSystem: 'metric',
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  currentStep: 1,
  totalSteps: TOTAL_STEPS,
  userData: INITIAL_USER_DATA,
  isVerified: false,
  verificationCode: '',
  isLoading: false,
  error: null,

  nextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, state.totalSteps),
  })),

  prevStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 1),
  })),

  goToStep: (step: number) => set({
    currentStep: Math.max(1, Math.min(step, TOTAL_STEPS)),
  }),

  updateUserData: (data: Partial<OnboardingUserData>) =>
    set((state) => ({
      userData: { ...state.userData, ...data },
    })),

  setVerified: (verified: boolean) => set({ isVerified: verified }),

  setVerificationCode: (code: string) => set({ verificationCode: code }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => set({ error }),

  resetOnboarding: () =>
    set({
      currentStep: 1,
      userData: INITIAL_USER_DATA,
      isVerified: false,
      verificationCode: '',
      isLoading: false,
      error: null,
    }),
}));

export const selectCurrentStep = (state: OnboardingStore): number => state.currentStep;
export const selectTotalSteps = (state: OnboardingStore): number => state.totalSteps;
export const selectUserData = (state: OnboardingStore): OnboardingUserData => state.userData;
export const selectIsVerified = (state: OnboardingStore): boolean => state.isVerified;
export const selectIsLoading = (state: OnboardingStore): boolean => state.isLoading;
export const selectError = (state: OnboardingStore): string | null => state.error;
