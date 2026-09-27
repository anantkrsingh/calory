import type { Plan, User } from '@fitness/types';
import type { SyncSubscriptionInput } from '@fitness/validation';
import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';
import { BaseService } from './base.service';

export interface SubscriptionStatus {
  isPro: boolean;
  plan: Plan | null;
  planName: string | null;
  planExpiresAt: string | null;
  remainingCredits: number;
  totalCredits: number;
}

export interface SyncSubscriptionResult {
  success: boolean;
  isPro: boolean;
  plan: Plan | null;
  user: User;
}

export class SubscriptionsService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/subscriptions', client);
  }

  /**
   * Sync active RevenueCat purchases or entitlements with the backend user record.
   */
  async sync(data: SyncSubscriptionInput): Promise<SyncSubscriptionResult> {
    const response = await this.client.post<SyncSubscriptionResult>(
      this.url('sync'),
      data,
    );
    return response.data;
  }

  /**
   * Fetch current subscription status, expiry, and plan details from the API.
   */
  async getStatus(): Promise<SubscriptionStatus> {
    const response = await this.client.get<SubscriptionStatus>(
      this.url('status'),
    );
    return response.data;
  }

  /**
   * Cancel or reset current subscription (used in dev test mode and account settings).
   */
  async cancel(): Promise<SyncSubscriptionResult> {
    const response = await this.client.post<SyncSubscriptionResult>(
      this.url('cancel'),
    );
    return response.data;
  }
}

export const subscriptionsService = new SubscriptionsService();
