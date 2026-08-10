import type { User } from '@fitness/types';

/** Whether every field the onboarding wizard collects is already on the profile. */
export function hasCompletedOnboarding(user: User): boolean {
  const { profile } = user;
  return (
    profile.sex !== undefined &&
    profile.dateOfBirth !== undefined &&
    profile.heightCm !== undefined &&
    profile.activityLevel !== undefined &&
    (profile.fitnessGoals?.length ?? 0) > 0
  );
}
