import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { Env } from '@fitness/config/server';
import { toUser } from '@fitness/db';
import type {
  AuthSession,
  AuthTokens,
  Id,
  JwtPayload,
  User,
} from '@fitness/types';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from '@fitness/validation';
import { compare, hash } from 'bcryptjs';

import { ENV } from '../config/env.module';
import { PrismaService } from '../prisma/prisma.service';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL: JwtSignOptions['expiresIn'] = '30d';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async register(input: RegisterInput): Promise<AuthSession> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException({
        message: 'That email is already registered',
        details: { email: ['Already registered'] },
      });
    }

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await hash(input.password, BCRYPT_ROUNDS),
        profile: { displayName: input.displayName },
        // Composite fields carry their own defaults; an empty object adopts them.
        preferences: {},
      },
    });

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
      user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv',
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

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

  async changePassword(
    userId: Id,
    input: ChangePasswordInput,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Account no longer exists');

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

    const decoded = this.jwt.decode(accessToken) as JwtPayload;

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
