import { UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcryptjs';

import { AuthService } from './auth.service';

const baseUser = {
  id: 'existing-id',
  email: 'ada@example.com',
  passwordHash: 'old-hash',
};

function makeService(user: typeof baseUser | null) {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(user),
      update: jest
        .fn()
        .mockImplementation(({ data }) => ({ ...user, ...data })),
    },
  };

  const otp = {
    sendOtp: jest.fn().mockResolvedValue({ success: true }),
    verifyOtp: jest.fn().mockResolvedValue({ success: true }),
  };

  const service = new AuthService(
    prisma as never,
    {} as never,
    otp as never,
    {} as never,
    {} as never,
    {} as never,
  );

  return { service, prisma, otp };
}

describe('AuthService.forgotPassword', () => {
  it('queues a password_reset code regardless of whether the email exists', async () => {
    const { service, otp } = makeService(null);

    const result = await service.forgotPassword({ email: 'ada@example.com' });

    expect(result.success).toBe(true);
    expect(otp.sendOtp).toHaveBeenCalledWith(
      'email',
      'ada@example.com',
      'password_reset',
    );
  });
});

describe('AuthService.resetPassword', () => {
  it('sets a new password once the code checks out', async () => {
    const { service, prisma, otp } = makeService(baseUser);

    await service.resetPassword({
      email: 'ada@example.com',
      code: '1234',
      password: 'NewPassw0rd',
    });

    expect(otp.verifyOtp).toHaveBeenCalledWith(
      'email',
      'ada@example.com',
      '1234',
      'password_reset',
    );
    const [[{ where, data }]] = prisma.user.update.mock.calls;
    expect(where).toEqual({ id: 'existing-id' });
    expect(data.refreshTokenHash).toBeNull();
    await expect(compare('NewPassw0rd', data.passwordHash)).resolves.toBe(true);
  });

  it('rejects an invalid or expired code without touching the password', async () => {
    const { service, prisma, otp } = makeService(baseUser);
    otp.verifyOtp.mockResolvedValue({
      success: false,
      message: 'Invalid OTP code.',
    });

    await expect(
      service.resetPassword({
        email: 'ada@example.com',
        code: '0000',
        password: 'NewPassw0rd',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects once the code is verified if the account no longer exists', async () => {
    const { service, prisma } = makeService(null);

    await expect(
      service.resetPassword({
        email: 'ghost@example.com',
        code: '1234',
        password: 'NewPassw0rd',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
