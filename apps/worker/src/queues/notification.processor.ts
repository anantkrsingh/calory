import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import {
  NOTIFICATION_QUEUE_NAME,
  type NotificationJobData,
  type NotificationJobResult,
} from '@fitness/types';
import { Queue, Worker, type Job } from 'bullmq';
import Expo, {
  type ExpoPushMessage,
  type ExpoPushReceipt,
  type ExpoPushTicket,
} from 'expo-server-sdk';

import { ENV, type Env } from '../config/env.module';
import { PrismaService } from '../prisma/prisma.service';

const RECEIPT_CHECK_REPEAT_KEY = 'notification-receipt-check';
// Expo keeps a receipt available for roughly a day; a ticket we still have no
// answer for by then is given up on rather than polled forever.
const RECEIPT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
// Caps one receipt-check tick so it can't turn into an unbounded scan — the
// rest is picked up on the next tick.
const RECEIPT_BATCH_SIZE = 1000;
// How many users to hold in memory at once when resolving an "all users" send.
const RECIPIENT_PAGE_SIZE = 500;

type NotificationJobPayload = NotificationJobData | Record<string, never>;
type CampaignContent = { id: string; title: string; body: string };
type Recipient = {
  id: string;
  email: string;
  profile: { displayName: string };
  pushTokens: string[];
};

@Injectable()
export class NotificationProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationProcessor.name);
  private queue?: Queue<NotificationJobPayload, NotificationJobResult | void>;
  private worker?: Worker<NotificationJobPayload, NotificationJobResult | void>;
  private readonly expo: Expo;

  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly prisma: PrismaService,
  ) {
    this.expo = new Expo(
      this.env.EXPO_ACCESS_TOKEN
        ? { accessToken: this.env.EXPO_ACCESS_TOKEN }
        : undefined,
    );
  }

  async onModuleInit(): Promise<void> {
    const connection = {
      host: this.env.REDIS_HOST,
      port: this.env.REDIS_PORT,
      password: this.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    };

    this.queue = new Queue(NOTIFICATION_QUEUE_NAME, {
      connection,
      prefix: 'fitness',
      defaultJobOptions: { removeOnComplete: 20, removeOnFail: 50 },
    });

    this.worker = new Worker<
      NotificationJobPayload,
      NotificationJobResult | void
    >(NOTIFICATION_QUEUE_NAME, (job) => this.handle(job), {
      connection,
      prefix: 'fitness',
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Notification job ${job?.id} (${job?.name}) failed: ${error.message}`,
      );
    });

    await this.scheduleReceiptChecks();
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }

  /** Idempotent: re-running replaces the existing repeat schedule. */
  private async scheduleReceiptChecks(): Promise<void> {
    try {
      await this.queue?.upsertJobScheduler(
        RECEIPT_CHECK_REPEAT_KEY,
        { pattern: this.env.NOTIFICATION_RECEIPT_CRON },
        { name: 'checkReceipts', data: {} },
      );
      this.logger.log(
        `Notification receipt check scheduled: ${this.env.NOTIFICATION_RECEIPT_CRON}`,
      );
    } catch (error) {
      this.logger.error(
        `Could not schedule notification receipt checks: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private handle(
    job: Job<NotificationJobPayload>,
  ): Promise<NotificationJobResult | void> {
    if (job.name === 'checkReceipts') return this.checkReceipts();
    return this.dispatchCampaign(job.data as NotificationJobData);
  }

  // ---------------------------------------------------------------------
  // Dispatch — turns a campaign into per-device Expo push sends.
  // ---------------------------------------------------------------------

  private async dispatchCampaign(
    data: NotificationJobData,
  ): Promise<NotificationJobResult> {
    const { campaignId } = data;
    const campaign = await this.prisma.notificationCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error(`Notification campaign ${campaignId} not found`);
    }

    // A cancel that lost the race with this job starting — nothing to do.
    if (campaign.status === 'canceled') {
      return { campaignId, recipientCount: 0 };
    }

    await this.prisma.notificationCampaign.update({
      where: { id: campaignId },
      data: { status: 'sending' },
    });

    const content: CampaignContent = {
      id: campaign.id,
      title: campaign.title,
      body: campaign.body,
    };

    let recipientCount = 0;
    try {
      recipientCount =
        campaign.targetType === 'users'
          ? await this.dispatchToUsers(content, campaign.targetUserIds)
          : await this.dispatchToAllUsers(content);

      await this.prisma.notificationCampaign.update({
        where: { id: campaignId },
        data: { status: 'sent', sentAt: new Date(), recipientCount },
      });
    } catch (error) {
      await this.prisma.notificationCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          recipientCount,
        },
      });
      throw error;
    }

    this.logger.log(
      `Notification ${campaignId} dispatched to ${recipientCount} device(s)`,
    );
    return { campaignId, recipientCount };
  }

  private async dispatchToUsers(
    campaign: CampaignContent,
    userIds: string[],
  ): Promise<number> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, pushTokens: { isEmpty: false } },
      select: { id: true, email: true, profile: true, pushTokens: true },
    });
    return this.sendToRecipients(campaign, users);
  }

  /** Cursor-pages through every user with a push token so a huge table never
   * has to be held in memory at once. */
  private async dispatchToAllUsers(campaign: CampaignContent): Promise<number> {
    let cursor: string | undefined;
    let total = 0;

    for (;;) {
      const page: Recipient[] = await this.prisma.user.findMany({
        where: { pushTokens: { isEmpty: false } },
        select: { id: true, email: true, profile: true, pushTokens: true },
        take: RECIPIENT_PAGE_SIZE,
        orderBy: { id: 'asc' },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      if (page.length === 0) break;

      total += await this.sendToRecipients(campaign, page);

      if (page.length < RECIPIENT_PAGE_SIZE) break;
      cursor = page[page.length - 1]!.id;
    }

    return total;
  }

  /**
   * Creates a pending `NotificationDelivery` row per device, sends in
   * Expo-sized chunks, and records each ticket. Returns the number of
   * devices attempted (one user can hold several).
   */
  private async sendToRecipients(
    campaign: CampaignContent,
    recipients: Recipient[],
  ): Promise<number> {
    const targets = recipients.flatMap((user) =>
      user.pushTokens
        .filter((token) => Expo.isExpoPushToken(token))
        .map((token) => ({ user, token })),
    );

    let attempted = 0;
    const chunkSize = Expo.pushNotificationChunkSizeLimit;

    for (let i = 0; i < targets.length; i += chunkSize) {
      const chunk = targets.slice(i, i + chunkSize);

      // Created up front (status `pending`) so a crash mid-send still leaves
      // an honest record instead of silently dropping the attempt.
      const deliveries = await Promise.all(
        chunk.map((target) =>
          this.prisma.notificationDelivery.create({
            data: {
              campaignId: campaign.id,
              userId: target.user.id,
              userEmail: target.user.email,
              userDisplayName: target.user.profile.displayName,
              pushToken: target.token,
              status: 'pending',
            },
          }),
        ),
      );

      const messages: ExpoPushMessage[] = deliveries.map((delivery) => ({
        to: delivery.pushToken,
        title: campaign.title,
        body: campaign.body,
        sound: 'default',
      }));

      let tickets: ExpoPushTicket[];
      try {
        tickets = await this.expo.sendPushNotificationsAsync(messages);
      } catch (error) {
        this.logger.error(
          `Expo push send failed for campaign ${campaign.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        await this.prisma.notificationDelivery.updateMany({
          where: { id: { in: deliveries.map((delivery) => delivery.id) } },
          data: {
            status: 'failed',
            errorMessage:
              error instanceof Error ? error.message : String(error),
            failedAt: new Date(),
          },
        });
        attempted += deliveries.length;
        continue;
      }

      // Expo returns one ticket per message, in the same order — see
      // `sendPushNotificationsAsync`'s doc comment in expo-server-sdk.
      await Promise.all(
        tickets.map((ticket, index) => {
          const delivery = deliveries[index]!;
          return ticket.status === 'ok'
            ? this.prisma.notificationDelivery.update({
                where: { id: delivery.id },
                data: {
                  status: 'sent',
                  ticketId: ticket.id,
                  sentAt: new Date(),
                },
              })
            : this.prisma.notificationDelivery.update({
                where: { id: delivery.id },
                data: {
                  status: 'failed',
                  errorCode: ticket.details?.error,
                  errorMessage: ticket.message,
                  failedAt: new Date(),
                },
              });
        }),
      );

      attempted += deliveries.length;
    }

    return attempted;
  }

  // ---------------------------------------------------------------------
  // Receipts — Expo only knows whether a push actually reached the device
  // some time after the ticket was issued; this polls for the answer.
  // ---------------------------------------------------------------------

  private async checkReceipts(): Promise<void> {
    const sent = await this.prisma.notificationDelivery.findMany({
      where: { status: 'sent', ticketId: { not: null } },
      take: RECEIPT_BATCH_SIZE,
      orderBy: { sentAt: 'asc' },
    });
    if (sent.length === 0) return;

    const now = Date.now();
    const stale = sent.filter(
      (delivery) =>
        delivery.sentAt && now - delivery.sentAt.getTime() > RECEIPT_MAX_AGE_MS,
    );
    const staleIds = new Set(stale.map((delivery) => delivery.id));
    const fresh = sent.filter((delivery) => !staleIds.has(delivery.id));

    if (stale.length > 0) {
      await this.prisma.notificationDelivery.updateMany({
        where: { id: { in: stale.map((delivery) => delivery.id) } },
        data: {
          status: 'failed',
          errorMessage: 'No delivery receipt from Expo within 24 hours',
          failedAt: new Date(),
        },
      });
    }

    if (fresh.length === 0) return;

    const byTicketId = new Map(
      fresh.map((delivery) => [delivery.ticketId as string, delivery]),
    );
    const chunks = this.expo.chunkPushNotificationReceiptIds([
      ...byTicketId.keys(),
    ]);

    for (const chunk of chunks) {
      let receipts: Record<string, ExpoPushReceipt>;
      try {
        receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
      } catch (error) {
        this.logger.error(
          `Failed to fetch Expo push receipts: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        continue;
      }

      for (const [receiptId, receipt] of Object.entries(receipts)) {
        const delivery = byTicketId.get(receiptId);
        if (!delivery) continue;

        if (receipt.status === 'ok') {
          await this.prisma.notificationDelivery.update({
            where: { id: delivery.id },
            data: { status: 'delivered', deliveredAt: new Date() },
          });
          continue;
        }

        await this.prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'failed',
            errorCode: receipt.details?.error,
            errorMessage: receipt.message,
            failedAt: new Date(),
          },
        });

        if (receipt.details?.error === 'DeviceNotRegistered') {
          await this.pruneToken(delivery.userId, delivery.pushToken);
        }
      }
      // Ticket ids Expo has no answer for yet are left `sent` — picked up
      // again next tick, or eventually given up on by the staleness check.
    }
  }

  /** Mirrors `UsersService.unregisterPushToken` — a token Expo says is dead
   * must stop being sent to. */
  private async pruneToken(userId: string, token: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.pushTokens.includes(token)) return;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          pushTokens: user.pushTokens.filter((existing) => existing !== token),
        },
      });
    } catch (error) {
      this.logger.error(
        `Could not prune stale push token for user ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
