import type { DietPlan, IsoDate, TodayDiet } from '@fitness/types';
import type { MarkDietItemsTakenInput } from '@fitness/validation';
import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';

import { BaseService } from './base.service';

export class DietPlansService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/diet-plans', client);
  }

  /** The caller's current AI-generated weekly diet plan (whatever its status). */
  async me(): Promise<DietPlan> {
    const { data } = await this.client.get<DietPlan>(this.url('me'));
    return data;
  }

  /** Today's meals layered with which items have actually been taken. */
  async today(date: IsoDate): Promise<TodayDiet> {
    const { data } = await this.client.get<TodayDiet>(
      this.url('today', date),
    );
    return data;
  }

  /** First-time creation and regeneration both go through this. */
  async regenerate(): Promise<DietPlan> {
    const { data } = await this.client.post<DietPlan>(this.url('regenerate'));
    return data;
  }

  /** Marks one item, or (with no `itemId`) a whole meal, taken/untaken for `date`. */
  async markTaken(
    date: IsoDate,
    input: MarkDietItemsTakenInput,
  ): Promise<TodayDiet> {
    const { data } = await this.client.patch<TodayDiet>(
      this.url('today', date),
      input,
    );
    return data;
  }
}

export const dietPlansService = new DietPlansService();
