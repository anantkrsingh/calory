import type { AuthSession, AuthTokens, User } from '@fitness/types';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from '@fitness/validation';

import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';
import { authState } from '@/stores/auth.store';

import { BaseService } from './base.service';

export class AuthService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/auth', client);
  }

  /** Registers, persists the returned session, and returns it. */
  async register(input: RegisterInput): Promise<AuthSession> {
    const { data: session } = await this.client.post<AuthSession>(
      this.url('register'),
      input,
      { skipAuth: true },
    );
    authState.setSession(session);
    return session;
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const { data: session } = await this.client.post<AuthSession>(
      this.url('login'),
      input,
      { skipAuth: true },
    );
    authState.setSession(session);
    return session;
  }

  /**
   * Exchanges a refresh token for a new pair. The interceptor in `api/http.ts`
   * runs this on its own when a request 401s, so app code rarely needs it directly.
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await this.client.post<AuthTokens>(
      this.url('refresh'),
      { refreshToken },
      { skipAuth: true, skipRetry: true },
    );
    return data;
  }

  /** Clears the local session even if the server call fails — logout must not block. */
  async logout(): Promise<void> {
    try {
      await this.client.post<void>(this.url('logout'));
    } finally {
      authState.clear();
    }
  }

  async me(): Promise<User> {
    const { data } = await this.client.get<User>(this.url('me'));
    return data;
  }

  async changePassword(input: ChangePasswordInput): Promise<void> {
    await this.client.post<void>(this.url('change-password'), input);
  }
}

export const authService = new AuthService();
