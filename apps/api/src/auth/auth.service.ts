import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { toUser } from '@fitness/db';
import type {
  AuthProvider,
  AuthSession,
  AuthTokens,
  Id,
  JwtPayload,
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
import { compare, hash } from 'bcryptjs';

import { ENV, type Env } from '../config/env.module';
import { MeasurementsService } from '../measurements/measurements.service';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../queues/otp.service';
import { WorkoutRoutineService } from '../routines/workout-routine.service';
import { SOCIAL_VERIFIERS } from './social-providers';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL: JwtSignOptions['expiresIn'] = '30d';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly otp: OtpService,
    private readonly measurements: MeasurementsService,
    private readonly workoutRoutines: WorkoutRoutineService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async register(input: RegisterInput): Promise<PendingVerification> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, emailVerified: true },
    });

    if (existing?.emailVerified) {
      throw new ConflictException({
        message: 'That email is already registered',
        details: { email: ['Already registered'] },
      });
    }

    const profile = {
      displayName: input.displayName,
      ...(input.profile?.avatarUrl
        ? { avatarUrl: input.profile.avatarUrl }
        : {}),
      ...(input.profile?.dateOfBirth
        ? { dateOfBirth: input.profile.dateOfBirth }
        : {}),
      ...(input.profile?.sex ? { sex: input.profile.sex } : {}),
      ...(input.profile?.heightCm != null
        ? { heightCm: input.profile.heightCm }
        : {}),
      ...(input.profile?.activityLevel
        ? { activityLevel: input.profile.activityLevel }
        : {}),
      ...(input.profile?.fitnessGoals?.length
        ? { fitnessGoals: input.profile.fitnessGoals }
        : {}),
    };

    const passwordHash = await hash(input.password, BCRYPT_ROUNDS);

    const appSettings = await this.prisma.appSettings.findFirst();
    const defaultCredits = appSettings?.freeChatsLimit ?? 5;

    const user = await this.prisma.user.upsert({
      where: { email: input.email },
      create: {
        email: input.email,
        passwordHash,
        emailVerified: false,
        profile,
        preferences: {},
        totalCredits: defaultCredits,
        remainingCredits: defaultCredits,
      },
      update: {
        passwordHash,
        emailVerified: false,
        profile,
        refreshTokenHash: null,
      },
    });

    if (input.measurement) {
      await this.measurements.create(user.id, input.measurement);
    }

    const { success } = await this.otp.sendOtp(
      'email',
      user.email,
      'registration',
      user.id,
    );

    return {
      userId: user.id,
      email: user.email,
      emailVerified: false,
      otpSent: success,
    };
  }

  async verifyRegistration(
    input: VerifyRegistrationInput,
  ): Promise<AuthSession> {
    const result = await this.otp.verifyOtp(
      'email',
      input.email,
      input.code,
      'registration',
    );

    if (!result.success) {
      throw new UnauthorizedException({
        message: result.message ?? 'Invalid OTP code',
        details: { code: [result.message ?? 'Invalid OTP code'] },
      });
    }

    const user = await this.prisma.user.update({
      where: { email: input.email },
      data: { emailVerified: true, lastLoginAt: new Date() },
    });

    await this.workoutRoutines.requestGeneration(user.id);

    return this.startSession(user.id, toUser(user));
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    // Compare unconditionally so a missing account and a wrong password take
    // the same time, leaving no timing signal for account enumeration.
    const passwordMatches = await compare(
      input.password,
      user?.passwordHash ??
        '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv',
    );

    if (!user || !user.passwordHash || !passwordMatches) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    // Logging back in cancels a pending self-delete, however far into the
    // grace period — `deletionRequestedAt: null` is a no-op when unset.
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), deletionRequestedAt: null },
    });

    return this.startSession(user.id, toUser(user));
  }

  async loginSocial(
    provider: AuthProvider,
    input: SocialLoginInput,
  ): Promise<AuthSession> {
    const profile = await SOCIAL_VERIFIERS[provider](input, this.env);

    const existing =
      (await this.prisma.user.findFirst({
        where: {
          linkedAccounts: {
            some: { provider: profile.provider, subject: profile.subject },
          },
        },
      })) ??
      (profile.email && profile.emailVerified
        ? await this.prisma.user.findUnique({ where: { email: profile.email } })
        : null);

    if (existing) {
      const alreadyLinked = existing.linkedAccounts.some(
        (account) =>
          account.provider === profile.provider &&
          account.subject === profile.subject,
      );

      const user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          lastLoginAt: new Date(),
          // Same cancel-on-login policy as the password flow.
          deletionRequestedAt: null,
          ...(alreadyLinked
            ? {}
            : {
                linkedAccounts: {
                  push: {
                    provider: profile.provider,
                    subject: profile.subject,
                    email: profile.email ?? null,
                  },
                },
              }),
          ...(profile.emailVerified && !existing.emailVerified
            ? { emailVerified: true }
            : {}),
          ...(profile.avatarUrl
            ? {
                profile: {
                  ...(existing.profile ?? {}),
                  avatarUrl: profile.avatarUrl,
                },
              }
            : {}),
        },
      });

      return this.startSession(user.id, toUser(user));
    }

    if (!profile.email) {
      throw new ConflictException({
        message: `Your ${provider} account did not share an email address`,
        details: { email: ['Required to create an account'] },
      });
    }

    const email = profile.email;
    const appSettings = await this.prisma.appSettings.findFirst();
    const defaultCredits = appSettings?.freeChatsLimit ?? 5;

    const user = await this.prisma.user.create({
      data: {
        email,
        emailVerified: profile.emailVerified,
        profile: {
          displayName: profile.displayName || email.split('@')[0] || email,
          avatarUrl: profile.avatarUrl ?? null,
        },
        preferences: {},
        totalCredits: defaultCredits,
        remainingCredits: defaultCredits,
        linkedAccounts: [
          {
            provider: profile.provider,
            subject: profile.subject,
            email: profile.email,
          },
        ],
        lastLoginAt: new Date(),
      },
    });

    await this.workoutRoutines.requestGeneration(user.id);

    return this.startSession(user.id, toUser(user));
  }

  /** Rotates the refresh token: a replayed old token no longer verifies. */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Session has been revoked');
    }

    const matches = await compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      // Presented a valid-looking token that is not the current one — treat the
      // session as compromised and force a full re-login.
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: null },
      });
      throw new UnauthorizedException('Session has been revoked');
    }

    const session = await this.startSession(user.id, toUser(user));
    return session.tokens;
  }

  async logout(userId: Id): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async me(userId: Id): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Account no longer exists');
    return toUser(user);
  }

  /** Emails a password_reset code. Always reports success — never confirm an email is registered. */
  async forgotPassword(
    input: ForgotPasswordInput,
  ): Promise<{ success: boolean; message?: string }> {
    return this.otp.sendOtp('email', input.email, 'password_reset');
  }

  /** Confirms the emailed code and sets a new password, same as changePassword does for other sessions. */
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const result = await this.otp.verifyOtp(
      'email',
      input.email,
      input.code,
      'password_reset',
    );

    if (!result.success) {
      throw new UnauthorizedException({
        message: result.message ?? 'Invalid OTP code',
        details: { code: [result.message ?? 'Invalid OTP code'] },
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hash(input.password, BCRYPT_ROUNDS),
        // Resetting the password ends every other session.
        refreshTokenHash: null,
      },
    });
  }

  async changePassword(userId: Id, input: ChangePasswordInput): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Account no longer exists');

    if (!user.passwordHash) {
      throw new ConflictException({
        message: 'This account signs in with a social provider',
        details: { currentPassword: ['No password is set on this account'] },
      });
    }

    const matches = await compare(input.currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException({
        message: 'Current password is incorrect',
        details: { currentPassword: ['Incorrect password'] },
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hash(input.newPassword, BCRYPT_ROUNDS),
        // Changing the password ends every other session.
        refreshTokenHash: null,
      },
    });
  }

  /** Issues a token pair and stores the refresh hash against the user. */
  private async startSession(userId: Id, user: User): Promise<AuthSession> {
    const claims = {
      sub: userId,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(claims, {
      // Format is enforced by the env schema; the library types it as a literal union.
      expiresIn: this.env.JWT_EXPIRES_IN as JwtSignOptions['expiresIn'],
    });
    const refreshToken = await this.jwt.signAsync(claims, {
      expiresIn: REFRESH_TOKEN_TTL,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: await hash(refreshToken, BCRYPT_ROUNDS) },
    });

    const decoded = this.jwt.decode<JwtPayload>(accessToken);

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
      },
    };
  }
}
