import type { AuthSession, AuthTokens, User } from '@fitness/types';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from '@fitness/validation';

import { type HttpClient, http } from '@/api/http';
import { authState } from '@/stores/auth.store';

import { BaseService } from './base.service';

export class AuthService extends BaseService {
  constructor(client: HttpClient = http) {
    super('/auth', client);
  }

  /** Registers, persists the returned session, and returns it. */
  async register(input: RegisterInput): Promise<AuthSession> {
    const session = await this.client.post<AuthSession>(this.url('register'), {
      body: input,
      skipAuth: true,
    });
    authState.setSession(session);
    return session;
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const session = await this.client.post<AuthSession>(this.url('login'), {
      body: input,
      skipAuth: true,
    });
    authState.setSession(session);
    return session;
  }

  /**
   * Exchanges a refresh token for a new pair. `HttpClient` runs this on its own
   * when a request 401s, so app code rarely needs it directly.
   */
  refresh(refreshToken: string): Promise<AuthTokens> {
    return this.client.post<AuthTokens>(this.url('refresh'), {
      body: { refreshToken },
      skipAuth: true,
      skipRetry: true,
    });
  }

  /** Clears the local session even if the server call fails — logout must not block. */
  async logout(): Promise<void> {
    try {
      await this.client.post<void>(this.url('logout'));
    } finally {
      authState.clear();
    }
  }

  me(): Promise<User> {
    return this.client.get<User>(this.url('me'));
  }

  changePassword(input: ChangePasswordInput): Promise<void> {
    return this.client.post<void>(this.url('change-password'), { body: input });
  }
}

export const authService = new AuthService();
