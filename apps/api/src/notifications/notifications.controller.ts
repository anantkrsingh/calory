import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {
  AuthenticatedUser,
  NotificationCampaign,
  NotificationDelivery,
  Paginated,
} from '@fitness/types';
import {
  createNotificationCampaignSchema,
  listNotificationCampaignsQuerySchema,
  listNotificationDeliveriesQuerySchema,
  notificationCampaignSchema,
  notificationDeliverySchema,
  objectIdSchema,
  type CreateNotificationCampaignInput,
  type ListNotificationCampaignsQueryInput,
  type ListNotificationDeliveriesQueryInput,
} from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { Roles } from '../auth/roles.guard';
import { ApiZodBody, ApiZodQuery, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create and send (or schedule) a push notification (admin only)',
    description:
      'Sends now when `scheduledAt` is omitted, otherwise queues it for that ' +
      'time. Delivery happens through the worker via Expo push; check ' +
      '`GET /notifications/:id/deliveries` for per-device status.',
  })
  @ApiZodBody(createNotificationCampaignSchema)
  @ApiZodResponse(notificationCampaignSchema, {
    status: 201,
    name: 'NotificationCampaign',
    description: 'The created (and queued) campaign',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(createNotificationCampaignSchema))
    body: CreateNotificationCampaignInput,
  ): Promise<NotificationCampaign> {
    return this.notifications.create(body, user.email);
  }

  @Get()
  @ApiOperation({ summary: 'List sent/scheduled notifications (admin only)' })
  @ApiZodQuery(listNotificationCampaignsQuerySchema)
  @ApiZodResponse(notificationCampaignSchema, {
    paginated: true,
    name: 'NotificationCampaign',
    description: 'Page of notifications, newest first',
  })
  list(
    @Query(zodPipe(listNotificationCampaignsQuerySchema))
    query: ListNotificationCampaignsQueryInput,
  ): Promise<Paginated<NotificationCampaign>> {
    return this.notifications.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one notification, with delivery counts (admin only)',
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(notificationCampaignSchema, {
    name: 'NotificationCampaign',
    description: 'The notification',
  })
  get(
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<NotificationCampaign> {
    return this.notifications.get(id);
  }

  @Get(':id/deliveries')
  @ApiOperation({
    summary: 'Per-device delivery log for one notification (admin only)',
    description: 'Filter by `status` — pending, sent, delivered, or failed.',
  })
  @ApiZodQuery(listNotificationDeliveriesQuerySchema)
  @ApiZodResponse(notificationDeliverySchema, {
    paginated: true,
    name: 'NotificationDelivery',
    description: 'Page of delivery attempts, newest first',
  })
  listDeliveries(
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Query(zodPipe(listNotificationDeliveriesQuerySchema))
    query: ListNotificationDeliveriesQueryInput,
  ): Promise<Paginated<NotificationDelivery>> {
    return this.notifications.listDeliveries(id, query);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel a still-scheduled notification (admin only)',
    description: 'No-op error once it has started dispatching.',
  })
  @ApiResponse({ status: 400, description: 'Already sent or already canceled' })
  @ApiZodResponse(notificationCampaignSchema, {
    name: 'NotificationCampaign',
    description: 'The canceled notification',
  })
  cancel(
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<NotificationCampaign> {
    return this.notifications.cancel(id);
  }
}
