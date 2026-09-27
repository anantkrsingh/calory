import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { toPlan, toUser } from '@fitness/db';
import type { Plan, User } from '@fitness/types';
import type { SyncSubscriptionInput } from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';

export interface SubscriptionStatusResponse {
  isPro: boolean;
  plan: Plan | null;
  planName: string | null;
  planExpiresAt: string | null;
  remainingCredits: number;
  totalCredits: number;
}

export interface SyncSubscriptionResponse {
  success: boolean;
  isPro: boolean;
  plan: Plan | null;
  user: User;
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Synchronizes RevenueCat customer state with the backend user record.
   * Matches purchased storeProductId or active entitlementIds to a Plan,
   * updates the user's plan assignment, expiration date, and credit limits.
   */
  async sync(
    userId: string,
    input: SyncSubscriptionInput,
  ): Promise<SyncSubscriptionResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasEntitlements = input.entitlementIds.length > 0;
    let matchedPlan = null;

    // Helper to detect duration from product ID string (e.g. 'com.calory.monthly', 'calory_yearly')
    const detectDurationFromId = (id?: string | null): string | null => {
      if (!id) return null;
      const lower = id.toLowerCase();
      if (lower.includes('year') || lower.includes('annual')) return 'yearly';
      if (lower.includes('month')) return 'monthly';
      if (lower.includes('week')) return 'weekly';
      return null;
    };

    const durationHint = detectDurationFromId(input.storeProductId);

    // 1. Try finding by storeProductId (e.g. com.calory.monthly, monthly, etc.)
    if (input.storeProductId) {
      matchedPlan = await this.prisma.plan.findFirst({
        where: {
          storeProductId: input.storeProductId,
          isActive: true,
        },
      });
    }

    // 2. If duration hint exists and no exact storeProductId match, match by duration & entitlement
    if (!matchedPlan && durationHint && hasEntitlements) {
      matchedPlan = await this.prisma.plan.findFirst({
        where: {
          duration: durationHint,
          revenueCatEntitlementIds: { hasSome: input.entitlementIds },
          isActive: true,
        },
      });
    }

    // 3. Try finding by revenueCatEntitlementIds
    if (!matchedPlan && hasEntitlements) {
      matchedPlan = await this.prisma.plan.findFirst({
        where: {
          revenueCatEntitlementIds: { hasSome: input.entitlementIds },
          isActive: true,
        },
      });
    }

    // 4. Fallback: If active entitlement exists but specific product ID didn't match,
    // assign the primary active paid plan
    if (!matchedPlan && hasEntitlements) {
      matchedPlan = await this.prisma.plan.findFirst({
        where: {
          isActive: true,
          price: { gt: 0 },
        },
        orderBy: { price: 'asc' },
      });
    }

    // Determine expiration date
    let expiresAt: Date | null = null;
    if (input.expirationDate) {
      expiresAt = new Date(input.expirationDate);
    } else if (matchedPlan) {
      let days = matchedPlan.durationDays;
      if (!days) {
        const d = matchedPlan.duration?.toLowerCase();
        if (d === 'yearly' || d === 'annual') days = 365;
        else if (d === 'monthly') days = 30;
        else if (d === 'weekly') days = 7;
      }
      if (days) {
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }
    }

    // If active entitlements exist and a plan was resolved, activate it
    if (hasEntitlements && matchedPlan) {
      const chatLimit = matchedPlan.chatMessagesLimit ?? 500;
      const shouldBoostCredits = (user.remainingCredits ?? 0) < chatLimit;

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          planId: matchedPlan.id,
          planName: matchedPlan.name,
          planExpiresAt: expiresAt,
          ...(shouldBoostCredits
            ? {
                totalCredits: chatLimit,
                remainingCredits: chatLimit,
              }
            : {}),
        },
        include: { plan: true },
      });

      this.logger.log(
        `Activated plan "${matchedPlan.name}" for user ${userId} (expires: ${expiresAt?.toISOString() ?? 'never'})`,
      );

      return {
        success: true,
        isPro: true,
        plan: toPlan(matchedPlan),
        user: toUser(updatedUser),
      };
    }

    // If no active entitlements provided, check if current plan has expired
    const isCurrentlyActive =
      user.planId && (!user.planExpiresAt || user.planExpiresAt > new Date());

    return {
      success: true,
      isPro: Boolean(isCurrentlyActive),
      plan: user.plan ? toPlan(user.plan) : null,
      user: toUser(user),
    };
  }

  /**
   * Cancels/resets active subscription for a user.
   * Useful for development/testing sandbox reset and customer account cancellation.
   */
  async cancel(userId: string): Promise<SyncSubscriptionResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(user.planId ? { plan: { disconnect: true } } : {}),
        planName: null,
        planExpiresAt: new Date(0),
      },
      include: { plan: true },
    });

    this.logger.log(`Subscription cancelled / reset for user ${userId}`);

    return {
      success: true,
      isPro: false,
      plan: null,
      user: toUser(updatedUser),
    };
  }

  /**
   * Returns current subscription status, limits, and plan details for a user.
   */
  async getStatus(userId: string): Promise<SubscriptionStatusResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPro = Boolean(
      user.planId && (!user.planExpiresAt || user.planExpiresAt > new Date()),
    );

    return {
      isPro,
      plan: user.plan ? toPlan(user.plan) : null,
      planName: user.planName,
      planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
      remainingCredits: user.remainingCredits,
      totalCredits: user.totalCredits,
    };
  }

  /**
   * Handles incoming webhooks from RevenueCat (INITIAL_PURCHASE, RENEWAL,
   * CANCELLATION, EXPIRATION, PRODUCT_CHANGE).
   */
  async handleWebhook(
    payload: any,
    authHeader?: string,
  ): Promise<{ received: boolean }> {
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_AUTH_HEADER;
    if (webhookSecret && authHeader !== webhookSecret) {
      this.logger.warn('Unauthorized RevenueCat webhook attempt');
      throw new UnauthorizedException('Invalid webhook authorization');
    }

    const event = payload?.event;
    if (!event) {
      return { received: true };
    }

    const {
      type,
      app_user_id,
      original_app_user_id,
      product_id,
      entitlement_ids,
      expiration_at_ms,
    } = event;

    const targetUserId = app_user_id || original_app_user_id;
    if (!targetUserId) {
      this.logger.warn('RevenueCat webhook event missing app_user_id');
      return { received: true };
    }

    this.logger.log(`Processing RevenueCat webhook "${type}" for user: ${targetUserId}`);

    // Try finding user by MongoDB ObjectId or email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: targetUserId }, { email: targetUserId }],
      },
    });

    if (!user) {
      this.logger.warn(`User ${targetUserId} not found for webhook event`);
      return { received: true };
    }

    const expiresAt = expiration_at_ms ? new Date(expiration_at_ms) : null;

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
      case 'UNCANCELLATION': {
        // Find matching plan
        let plan = null;
        if (product_id) {
          plan = await this.prisma.plan.findFirst({
            where: { storeProductId: product_id, isActive: true },
          });
        }
        const webhookDuration = (product_id && (product_id.toLowerCase().includes('year') || product_id.toLowerCase().includes('annual')))
          ? 'yearly'
          : (product_id && product_id.toLowerCase().includes('month'))
            ? 'monthly'
            : (product_id && product_id.toLowerCase().includes('week'))
              ? 'weekly'
              : null;

        if (!plan && webhookDuration && Array.isArray(entitlement_ids) && entitlement_ids.length > 0) {
          plan = await this.prisma.plan.findFirst({
            where: {
              duration: webhookDuration,
              revenueCatEntitlementIds: { hasSome: entitlement_ids },
              isActive: true,
            },
          });
        }
        if (!plan && Array.isArray(entitlement_ids) && entitlement_ids.length > 0) {
          plan = await this.prisma.plan.findFirst({
            where: {
              revenueCatEntitlementIds: { hasSome: entitlement_ids },
              isActive: true,
            },
          });
        }
        if (!plan) {
          plan = await this.prisma.plan.findFirst({
            where: { isActive: true, price: { gt: 0 } },
          });
        }

        if (plan) {
          const chatLimit = plan.chatMessagesLimit ?? 500;
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              planId: plan.id,
              planName: plan.name,
              planExpiresAt: expiresAt,
              remainingCredits: Math.max(user.remainingCredits, chatLimit),
              totalCredits: Math.max(user.totalCredits, chatLimit),
            },
          });
          this.logger.log(
            `Webhook successfully updated user ${user.id} to plan ${plan.name}`,
          );
        }
        break;
      }

      case 'EXPIRATION': {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            planExpiresAt: expiresAt ?? new Date(),
          },
        });
        this.logger.log(`User ${user.id} subscription marked expired`);
        break;
      }

      case 'CANCELLATION': {
        if (expiresAt) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              planExpiresAt: expiresAt,
            },
          });
        }
        break;
      }

      default:
        this.logger.debug(`Unhandled RevenueCat webhook event type: ${type}`);
    }

    return { received: true };
  }
}
