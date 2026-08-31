import type {
  AuthProvider,
  AuthSession,
  AuthTokens,
  PendingVerification,
  User,
} from '@fitness/types';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  SocialLoginInput,
  VerifyRegistrationInput,
} from '@fitness/validation';

import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';
import { authState } from '@/stores/auth.store';

import { BaseService } from './base.service';

export class AuthService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/auth', client);
  }

  /**
   * Creates the account and emails a verification code.
   * No session is issued until `verifyRegistration` succeeds.
   */
  async register(input: RegisterInput): Promise<PendingVerification> {
    const { data } = await this.client.post<PendingVerification>(
      this.url('register'),
      input,
      { skipAuth: true },
    );
    return data;
  }

  /** Verifies the emailed code and persists the returned session. */
  async verifyRegistration(input: VerifyRegistrationInput): Promise<AuthSession> {
    const { data: session } = await this.client.post<AuthSession>(
      this.url('verify-registration'),
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

  async loginGoogle(input: SocialLoginInput): Promise<AuthSession> {
    return this.loginSocial('google', input);
  }

  async loginFacebook(input: SocialLoginInput): Promise<AuthSession> {
    return this.loginSocial('facebook', input);
  }

  async loginX(input: SocialLoginInput): Promise<AuthSession> {
    return this.loginSocial('x', input);
  }

  private async loginSocial(
    provider: AuthProvider,
    input: SocialLoginInput,
  ): Promise<AuthSession> {
    const { data: session } = await this.client.post<AuthSession>(
      this.url(provider),
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

  /** Emails a password_reset code. Calling it again resends — the previous code stops working. */
  async forgotPassword(
    input: ForgotPasswordInput,
  ): Promise<{ success: boolean; message?: string }> {
    const { data } = await this.client.post<{ success: boolean; message?: string }>(
      this.url('forgot-password'),
      input,
      { skipAuth: true },
    );
    return data;
  }

  /** Confirms the emailed code and sets a new password. */
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    await this.client.post<void>(this.url('reset-password'), input, {
      skipAuth: true,
    });
  }
}

export const authService = new AuthService();
