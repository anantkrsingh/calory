import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthProvider, type SocialProfile } from '@fitness/types';

import { AuthService } from './auth.service';
import * as providers from './social-providers';

const PROFILE: SocialProfile = {
  provider: AuthProvider.Google,
  subject: 'google-123',
  email: 'ada@example.com',
  displayName: 'Ada',
  emailVerified: true,
};

type UserRecord = Record<string, any>;

function makeService(user: UserRecord | null) {
  const prisma = {
    user: {
      findFirst: jest
        .fn<Promise<UserRecord | null>, [unknown?]>()
        .mockResolvedValue(
          user && (user.linkedAccounts as unknown[])?.length ? user : null,
        ),
      findUnique: jest
        .fn<Promise<UserRecord | null>, [unknown?]>()
        .mockResolvedValue(user),
      update: jest
        .fn<UserRecord, [{ where: { id: string }; data: UserRecord }]>()
        .mockImplementation(({ data }) => ({
          ...baseUser,
          ...user,
          ...data,
        })),
      upsert: jest
        .fn<
          UserRecord,
          [{ where: unknown; create: UserRecord; update: UserRecord }]
        >()
        .mockImplementation(({ create, update }) => ({
          ...baseUser,
          ...(user ? { ...user, ...update } : create),
          id: user ? 'existing-id' : 'new-id',
        })),
      create: jest
        .fn<UserRecord, [{ data: UserRecord }]>()
        .mockImplementation(({ data }) => ({
          id: 'new-id',
          role: 'user',
          planExpiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
          preferences: { ...baseUser.preferences, ...data.preferences },
        })),
    },
    appSettings: {
      findFirst: jest.fn().mockResolvedValue({ freeChatsLimit: 5 }),
    },
  };

  const jwt = {
    signAsync: jest.fn().mockResolvedValue('token'),
    decode: jest.fn().mockReturnValue({ exp: 1893456000 }),
  };

  const otp = {
    sendOtp: jest.fn().mockResolvedValue({ success: true }),
    verifyOtp: jest.fn().mockResolvedValue({ success: true }),
  };
  const measurements = { create: jest.fn() };
  const workoutRoutines = { requestGeneration: jest.fn() };

  const service = new AuthService(
    prisma as never,
    jwt as never,
    otp as never,
    measurements as never,
    workoutRoutines as never,
    { JWT_EXPIRES_IN: '7d' } as never,
  );

  return { service, prisma, otp, measurements, workoutRoutines };
}

const baseUser = {
  id: 'existing-id',
  email: 'ada@example.com',
  emailVerified: false,
  role: 'user',
  profile: { displayName: 'Ada' },
  preferences: {
    units: 'metric',
    timezone: 'UTC',
    notificationsEnabled: true,
  },
  linkedAccounts: [],
  planExpiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService.loginSocial', () => {
  afterEach(() => jest.restoreAllMocks());

  function stubVerifier(profile: SocialProfile): void {
    providers.SOCIAL_VERIFIERS[AuthProvider.Google] = () =>
      Promise.resolve(profile);
  }

  const realGoogle = providers.SOCIAL_VERIFIERS[AuthProvider.Google];
  afterEach(() => {
    providers.SOCIAL_VERIFIERS[AuthProvider.Google] = realGoogle;
  });

  it('links an existing email account instead of rejecting it', async () => {
    const { service, prisma } = makeService(baseUser);
    stubVerifier(PROFILE);

    await service.loginSocial(AuthProvider.Google, { token: 't' });

    const update = prisma.user.update.mock.calls[0]![0];
    expect(update.where).toEqual({ id: 'existing-id' });
    expect(update.data.linkedAccounts.push).toMatchObject({
      provider: 'google',
      subject: 'google-123',
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('refuses to claim an account when the provider email is unverified', async () => {
    const { service, prisma } = makeService(baseUser);
    stubVerifier({ ...PROFILE, emailVerified: false });

    await service.loginSocial(AuthProvider.Google, { token: 't' });

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('creates an account on first sign-in', async () => {
    const { service, prisma } = makeService(null);
    stubVerifier(PROFILE);

    await service.loginSocial(AuthProvider.Google, { token: 't' });

    const created = prisma.user.create.mock.calls[0]![0].data;
    expect(created.email).toBe('ada@example.com');
    expect(created.linkedAccounts).toEqual([
      { provider: 'google', subject: 'google-123', email: 'ada@example.com' },
    ]);
  });

  it('rejects a provider that shares no email when no account matches', async () => {
    const { service } = makeService(null);
    stubVerifier({ ...PROFILE, email: undefined, emailVerified: false });

    await expect(
      service.loginSocial(AuthProvider.Google, { token: 't' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('AuthService.register', () => {
  const input = {
    email: 'ada@example.com',
    password: 'Password1',
    displayName: 'Ada',
  };

  it('saves the account unverified, sends an OTP, and issues no tokens', async () => {
    const { service, prisma, otp } = makeService(null);

    const result = await service.register(input);

    expect(prisma.user.upsert.mock.calls[0]![0].create.emailVerified).toBe(
      false,
    );
    expect(otp.sendOtp).toHaveBeenCalledWith(
      'email',
      'ada@example.com',
      'registration',
      'new-id',
    );
    expect(result).toMatchObject({ emailVerified: false, otpSent: true });
    expect(result).not.toHaveProperty('tokens');
  });

  it('upserts the body measurement when one is supplied', async () => {
    const { service, measurements } = makeService(null);

    await service.register({
      ...input,
      measurement: { weightKg: 70 },
    } as never);

    expect(measurements.create).toHaveBeenCalledWith('new-id', {
      weightKg: 70,
    });
  });

  it('rejects an email that is already registered and verified', async () => {
    const { service } = makeService({ ...baseUser, emailVerified: true });

    await expect(service.register(input as never)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('lets an unverified signup retry, replacing the pending account', async () => {
    const { service, prisma } = makeService({
      ...baseUser,
      emailVerified: false,
    });

    await service.register(input);

    expect(prisma.user.upsert).toHaveBeenCalled();
  });
});

describe('AuthService.verifyRegistration', () => {
  it('sets emailVerified and returns a full session', async () => {
    const { service, prisma, otp } = makeService(baseUser);

    const session = await service.verifyRegistration({
      email: 'ada@example.com',
      code: '123456',
    });

    expect(otp.verifyOtp).toHaveBeenCalledWith(
      'email',
      'ada@example.com',
      '123456',
      'registration',
    );
    expect(prisma.user.update.mock.calls[0]![0].data.emailVerified).toBe(true);
    expect(session.tokens.accessToken).toBe('token');
  });

  it('requests routine generation once the email is verified', async () => {
    const { service, workoutRoutines } = makeService(baseUser);

    await service.verifyRegistration({
      email: 'ada@example.com',
      code: '123456',
    });

    expect(workoutRoutines.requestGeneration).toHaveBeenCalledWith(
      'existing-id',
    );
  });

  it('still returns a session when routine generation cannot be queued', async () => {
    const { service, workoutRoutines } = makeService(baseUser);
    workoutRoutines.requestGeneration.mockResolvedValue(null);

    const session = await service.verifyRegistration({
      email: 'ada@example.com',
      code: '123456',
    });

    expect(session.tokens.accessToken).toBe('token');
  });

  it('issues no session when the code is wrong', async () => {
    const { service, otp } = makeService(baseUser);
    otp.verifyOtp.mockResolvedValue({
      success: false,
      message: 'Invalid OTP code.',
    });

    await expect(
      service.verifyRegistration({ email: 'ada@example.com', code: '000000' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
