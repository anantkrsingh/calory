import type { Entity, Id, IsoDate } from './common';
import type { ActivityLevel, Sex, UnitSystem, UserRole } from './enums';

export interface UserProfile {
  displayName: string;
  avatarUrl?: string;
  dateOfBirth?: IsoDate;
  sex?: Sex;
  heightCm?: number;
  activityLevel?: ActivityLevel;
}

export interface UserPreferences {
  units: UnitSystem;
  /** IANA zone, e.g. `Europe/Berlin`. Drives "today" boundaries in stats. */
  timezone: string;
  weeklyWorkoutTarget: number;
  restTimerSeconds: number;
  notificationsEnabled: boolean;
}

/** A user as exposed by the API — never carries the password hash. */
export interface User extends Entity {
  email: string;
  emailVerified: boolean;
  role: UserRole;
  profile: UserProfile;
  preferences: UserPreferences;
}

export interface UserSummary {
  id: Id;
  displayName: string;
  avatarUrl?: string;
}
