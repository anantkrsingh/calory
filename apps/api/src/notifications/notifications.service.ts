import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  paginate,
  toNotificationCampaign,
  toNotificationDelivery,
  toSkipTake,
} from '@fitness/db';
import type {
  Id,
  NotificationCampaign,
  NotificationDelivery,
  NotificationDeliveryCounts,
  Paginated,
} from '@fitness/types';
import type {
  CreateNotificationCampaignInput,
  ListNotificationCampaignsQueryInput,
  ListNotificationDeliveriesQueryInput,
} from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationQueue } from '../queues/notification.queue';

const EMPTY_COUNTS: NotificationDeliveryCounts = {
  pending: 0,
  sent: 0,
  delivered: 0,
  failed: 0,
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: NotificationQueue,
  ) {}

  async create(
    input: CreateNotificationCampaignInput,
    createdByEmail: string,
  ): Promise<NotificationCampaign> {
    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    const delayMs = scheduledAt ? scheduledAt.getTime() - Date.now() : 0;

    if (scheduledAt && delayMs <= 0) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    const campaign = await this.prisma.notificationCampaign.create({
      data: {
        title: input.title,
        body: input.body,
        targetType: input.targetType,
        targetUserIds: input.targetType === 'users' ? input.targetUserIds : [],
        status: 'scheduled',
        scheduledAt,
        createdByEmail,
      },
    });

    const job = await this.queue.dispatch(campaign.id, Math.max(0, delayMs));

    if (!job) {
      const failed = await this.prisma.notificationCampaign.update({
        where: { id: campaign.id },
        data: { status: 'failed', error: 'Could not queue the send job' },
      });
      return toNotificationCampaign(failed, EMPTY_COUNTS);
    }

    return toNotificationCampaign(campaign, EMPTY_COUNTS);
  }

  async list(
    query: ListNotificationCampaignsQueryInput,
  ): Promise<Paginated<NotificationCampaign>> {
    const where: Prisma.NotificationCampaignWhereInput = query.status
      ? { status: query.status }
      : {};

    const { skip, take } = toSkipTake(query);

    const [rows, total] = await Promise.all([
      this.prisma.notificationCampaign.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notificationCampaign.count({ where }),
    ]);

    const counts = await this.countsByCampaign(rows.map((row) => row.id));

    return paginate(
      rows.map((row) =>
        toNotificationCampaign(row, counts.get(row.id) ?? EMPTY_COUNTS),
      ),
      query,
      total,
    );
  }

  async get(id: Id): Promise<NotificationCampaign> {
    const row = await this.prisma.notificationCampaign.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Notification not found');

    const counts = await this.countsByCampaign([id]);
    return toNotificationCampaign(row, counts.get(id) ?? EMPTY_COUNTS);
  }

  async listDeliveries(
    campaignId: Id,
    query: ListNotificationDeliveriesQueryInput,
  ): Promise<Paginated<NotificationDelivery>> {
    const campaign = await this.prisma.notificationCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundException('Notification not found');

    const where: Prisma.NotificationDeliveryWhereInput = {
      campaignId,
      ...(query.status ? { status: query.status } : {}),
    };

    const { skip, take } = toSkipTake(query);

    const [rows, total] = await Promise.all([
      this.prisma.notificationDelivery.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notificationDelivery.count({ where }),
    ]);

    return paginate(rows.map(toNotificationDelivery), query, total);
  }

  /** Pulls a still-scheduled campaign out of the queue before it dispatches. */
  async cancel(id: Id): Promise<NotificationCampaign> {
    const campaign = await this.prisma.notificationCampaign.findUnique({
      where: { id },
    });
    if (!campaign) throw new NotFoundException('Notification not found');

    if (campaign.status !== 'scheduled') {
      throw new BadRequestException(
        'Only a still-scheduled notification can be canceled',
      );
    }

    const canceled = await this.queue.cancel(id);
    if (!canceled) {
      throw new BadRequestException(
        'This notification already started sending and can no longer be canceled',
      );
    }

    const row = await this.prisma.notificationCampaign.update({
      where: { id },
      data: { status: 'canceled' },
    });

    return toNotificationCampaign(row, EMPTY_COUNTS);
  }

  private async countsByCampaign(
    campaignIds: Id[],
  ): Promise<Map<Id, NotificationDeliveryCounts>> {
    const counts = new Map<Id, NotificationDeliveryCounts>();
    if (campaignIds.length === 0) return counts;

    const groups = await this.prisma.notificationDelivery.groupBy({
      by: ['campaignId', 'status'],
      where: { campaignId: { in: campaignIds } },
      _count: { _all: true },
    });

    for (const group of groups) {
      const entry = counts.get(group.campaignId) ?? { ...EMPTY_COUNTS };
      entry[group.status] = group._count._all;
      counts.set(group.campaignId, entry);
    }

    return counts;
  }
}
