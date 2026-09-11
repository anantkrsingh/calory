import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { NotificationCampaignStatus } from '@fitness/types';

import { NotificationsService } from './notifications.service';

const baseCampaign = {
  id: 'campaign-1',
  title: 'Hello',
  body: 'World',
  targetType: 'all' as const,
  targetUserIds: [] as string[],
  status: 'scheduled' as NotificationCampaignStatus,
  scheduledAt: null as Date | null,
  sentAt: null as Date | null,
  error: null as string | null,
  recipientCount: 0,
  createdByEmail: 'admin@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeService(
  campaign: typeof baseCampaign | null,
  queueOverrides: { dispatch?: unknown; cancel?: unknown } = {},
) {
  type CampaignRecord = typeof baseCampaign;

  const prisma = {
    notificationCampaign: {
      create: jest
        .fn<CampaignRecord, [{ data: Partial<CampaignRecord> }]>()
        .mockImplementation(({ data }) => ({
          ...baseCampaign,
          ...data,
          id: 'campaign-1',
        })),
      update: jest
        .fn<
          CampaignRecord,
          [{ where: { id: string }; data: Partial<CampaignRecord> }]
        >()
        .mockImplementation(({ data }) => ({
          ...(campaign ?? baseCampaign),
          ...data,
        })),
      findUnique: jest.fn().mockResolvedValue(campaign),
      findMany: jest.fn().mockResolvedValue(campaign ? [campaign] : []),
      count: jest.fn().mockResolvedValue(campaign ? 1 : 0),
    },
    notificationDelivery: {
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  };

  const queue = {
    dispatch:
      queueOverrides.dispatch ?? jest.fn().mockResolvedValue({ id: 'job-1' }),
    cancel: queueOverrides.cancel ?? jest.fn().mockResolvedValue(true),
  };

  const service = new NotificationsService(prisma as never, queue as never);

  return { service, prisma, queue };
}

describe('NotificationsService.create', () => {
  it('sends immediately (delay 0) when scheduledAt is omitted', async () => {
    const { service, queue } = makeService(null);

    await service.create(
      { title: 'Hi', body: 'Body', targetType: 'all' },
      'admin@example.com',
    );

    expect(queue.dispatch).toHaveBeenCalledWith('campaign-1', 0);
  });

  it('rejects a scheduledAt in the past', async () => {
    const { service } = makeService(null);

    await expect(
      service.create(
        {
          title: 'Hi',
          body: 'Body',
          targetType: 'all',
          scheduledAt: new Date(Date.now() - 60_000).toISOString(),
        },
        'admin@example.com',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('marks the campaign failed when the queue cannot accept the job', async () => {
    const dispatch = jest.fn().mockResolvedValue(null);
    const { service, prisma } = makeService(null, { dispatch });

    const result = await service.create(
      { title: 'Hi', body: 'Body', targetType: 'all' },
      'admin@example.com',
    );

    expect(prisma.notificationCampaign.update).toHaveBeenCalledWith({
      where: { id: 'campaign-1' },
      data: { status: 'failed', error: 'Could not queue the send job' },
    });
    expect(result.status).toBe('failed');
  });

  it('stores the hand-picked recipients when targeting specific users', async () => {
    const { service, prisma } = makeService(null);

    await service.create(
      {
        title: 'Hi',
        body: 'Body',
        targetType: 'users',
        targetUserIds: ['user-1', 'user-2'],
      },
      'admin@example.com',
    );

    const created = prisma.notificationCampaign.create.mock.calls[0]![0].data;
    expect(created).toMatchObject({
      targetType: 'users',
      targetUserIds: ['user-1', 'user-2'],
    });
  });
});

describe('NotificationsService.cancel', () => {
  it('cancels a still-scheduled campaign', async () => {
    const { service, prisma } = makeService(baseCampaign);

    const result = await service.cancel('campaign-1');

    expect(prisma.notificationCampaign.update).toHaveBeenCalledWith({
      where: { id: 'campaign-1' },
      data: { status: 'canceled' },
    });
    expect(result.status).toBe('canceled');
  });

  it('refuses to cancel a campaign that already started sending', async () => {
    const { service } = makeService({ ...baseCampaign, status: 'sending' });

    await expect(service.cancel('campaign-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('surfaces a clear error when the queue lost the race', async () => {
    const cancel = jest.fn().mockResolvedValue(false);
    const { service } = makeService(baseCampaign, { cancel });

    await expect(service.cancel('campaign-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects an unknown campaign id', async () => {
    const { service } = makeService(null);

    await expect(service.cancel('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
