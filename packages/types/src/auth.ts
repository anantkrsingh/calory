import type { Id, IsoDateTime } from './common';
import type { AuthProvider, UserRole } from './enums';
import type { User } from './user';

export interface SocialProfile {
  provider: AuthProvider;
  subject: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  emailVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Absolute expiry of `accessToken`, so clients can refresh pre-emptively. */
  expiresAt: IsoDateTime;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

export interface PendingVerification {
  userId: Id;
  email: string;
  emailVerified: false;
  otpSent: boolean;
}

/** Decoded JWT payload. `sub` is the user id. */
export interface JwtPayload {
  sub: Id;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/** The authenticated principal attached to each request by the JWT guard. */
export interface AuthenticatedUser {
  id: Id;
  email: string;
  role: UserRole;
}
