import { ConflictException } from '@nestjs/common';

import { OtpService } from './otp.service';

function makeService(user: { emailVerified: boolean } | null) {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockResolvedValue({ id: 'user-1' }),
    },
  };

  const queue = {
    generateOtp: jest.fn().mockReturnValue('1234'),
    sendOtp: jest.fn().mockResolvedValue({ id: 'job-1' }),
  };

  const service = new OtpService(
    { OTP_EXPIRY_MINUTES: 10, OTP_LENGTH: 4 } as never,
    queue as never,
    prisma as never,
  );

  return { service, prisma, queue };
}

describe('OtpService.sendOtp', () => {
  it('refuses to send a registration code to a verified account', async () => {
    const { service, queue } = makeService({ emailVerified: true });

    await expect(
      service.sendOtp('email', 'Ada@Example.com', 'registration'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(queue.sendOtp).not.toHaveBeenCalled();
  });

  it('sends when the account exists but is not yet verified', async () => {
    const { service, queue } = makeService({ emailVerified: false });

    const result = await service.sendOtp(
      'email',
      'ada@example.com',
      'registration',
    );

    expect(result.success).toBe(true);
    expect(queue.sendOtp).toHaveBeenCalled();
  });

  it('does not check registration status for a password reset', async () => {
    const { service, prisma, queue } = makeService({ emailVerified: true });

    await service.sendOtp('email', 'ada@example.com', 'password_reset');

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(queue.sendOtp).toHaveBeenCalled();
  });
});

describe('OtpService.verifyOtp', () => {
  it('sets emailVerified once the correct code is presented', async () => {
    const { service, prisma } = makeService({ emailVerified: false });

    await service.sendOtp('email', 'ada@example.com', 'registration');
    const result = await service.verifyOtp(
      'email',
      'ada@example.com',
      '1234',
      'registration',
    );

    expect(result.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: 'ada@example.com' },
      data: { emailVerified: true },
      select: { id: true },
    });
  });

  it('leaves the flag alone when the code is wrong', async () => {
    const { service, prisma } = makeService({ emailVerified: false });

    await service.sendOtp('email', 'ada@example.com', 'registration');
    const result = await service.verifyOtp(
      'email',
      'ada@example.com',
      '9999',
      'registration',
    );

    expect(result.success).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('leaves the flag alone when no code was requested', async () => {
    const { service, prisma } = makeService(null);

    const result = await service.verifyOtp(
      'email',
      'ada@example.com',
      '1234',
      'registration',
    );

    expect(result.success).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
