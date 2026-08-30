import type { Entity, Id, IsoDate } from './common';
import type { ActivityLevel, FitnessGoal, Sex, UnitSystem, UserRole } from './enums';

export interface UserProfile {
  displayName: string;
  avatarUrl?: string;
  dateOfBirth?: IsoDate;
  sex?: Sex;
  heightCm?: number;
  activityLevel?: ActivityLevel;
  fitnessGoals?: FitnessGoal[];
}

export interface UserPreferences {
  units: UnitSystem;
  timezone: string;
  notificationsEnabled: boolean;
}

export interface User extends Entity {
  email: string;
  emailVerified: boolean;
  role: UserRole;
  profile: UserProfile;
  preferences: UserPreferences;
  totalCredits?: number;
  remainingCredits?: number;
  planId?: Id;
  planName?: string;
  planExpiresAt?: IsoDate;
  /** Lifetime chat token usage, summed across every assistant reply. */
  lifetimeInputTokens?: number;
  lifetimeOutputTokens?: number;
  lifetimeTotalTokens?: number;
}

export interface UserSummary {
  id: Id;
  displayName: string;
  avatarUrl?: string;
}
