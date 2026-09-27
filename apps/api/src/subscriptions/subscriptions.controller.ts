import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '@fitness/types';
import {
  syncSubscriptionSchema,
  type SyncSubscriptionInput,
} from '@fitness/validation';

import { CurrentUser, Public } from '../common/decorators';
import { ApiZodBody } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import {
  SubscriptionsService,
  type SubscriptionStatusResponse,
  type SyncSubscriptionResponse,
} from './subscriptions.service';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('sync')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Synchronize in-app purchases and RevenueCat entitlements with backend user profile',
  })
  @ApiZodBody(syncSubscriptionSchema)
  @ApiResponse({
    status: 200,
    description: 'Updated user profile and plan subscription status',
  })
  sync(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(syncSubscriptionSchema)) body: SyncSubscriptionInput,
  ): Promise<SyncSubscriptionResponse> {
    return this.subscriptionsService.sync(user.id, body);
  }

  @Get('status')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get active subscription status, expiry, and feature limits',
  })
  @ApiResponse({
    status: 200,
    description: 'Current subscription and plan details',
  })
  getStatus(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SubscriptionStatusResponse> {
    return this.subscriptionsService.getStatus(user.id);
  }

  @Post('cancel')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Cancel or reset current subscription (Development / Testing / Customer Service)',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription reset and plan set to free',
  })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SyncSubscriptionResponse> {
    return this.subscriptionsService.cancel(user.id);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Incoming server-to-server webhook from RevenueCat',
  })
  @ApiResponse({ status: 200, description: 'Webhook received' })
  webhook(
    @Body() payload: any,
    @Headers('authorization') authHeader?: string,
  ): Promise<{ received: boolean }> {
    return this.subscriptionsService.handleWebhook(payload, authHeader);
  }
}
