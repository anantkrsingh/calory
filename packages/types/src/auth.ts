import type { Id, IsoDateTime } from './common';
import type { UserRole } from './enums';
import type { User } from './user';

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
