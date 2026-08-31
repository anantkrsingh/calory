import { NotFoundException } from '@nestjs/common';

import { UsersService } from './users.service';

const baseUser = {
  id: 'existing-id',
  pushTokens: ['token-a'],
  preferences: {
    units: 'metric',
    timezone: 'UTC',
    notificationsEnabled: false,
  },
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

  const service = new UsersService(prisma as never, {} as never);

  return { service, prisma };
}

describe('UsersService.registerPushToken', () => {
  it('adds a new token and turns notifications on', async () => {
    const { service, prisma } = makeService(baseUser);

    await service.registerPushToken('existing-id', 'token-b');

    const [[{ data }]] = prisma.user.update.mock.calls;
    expect(data.pushTokens).toEqual(['token-a', 'token-b']);
    expect(data.preferences.notificationsEnabled).toBe(true);
  });

  it('is a no-op when the token and the flag are already set', async () => {
    const { service, prisma } = makeService({
      ...baseUser,
      preferences: { ...baseUser.preferences, notificationsEnabled: true },
    });

    await service.registerPushToken('existing-id', 'token-a');

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects an unknown user', async () => {
    const { service } = makeService(null);

    await expect(
      service.registerPushToken('ghost-id', 'token-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('UsersService.unregisterPushToken', () => {
  it('drops the token without touching notification preferences', async () => {
    const { service, prisma } = makeService({
      ...baseUser,
      pushTokens: ['token-a', 'token-b'],
    });

    await service.unregisterPushToken('existing-id', 'token-a');

    const [[{ data }]] = prisma.user.update.mock.calls;
    expect(data.pushTokens).toEqual(['token-b']);
    expect(data.preferences).toBeUndefined();
  });

  it('is a no-op when the token is not registered', async () => {
    const { service, prisma } = makeService(baseUser);

    await service.unregisterPushToken('existing-id', 'unknown-token');

    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
