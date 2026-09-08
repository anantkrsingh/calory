import type { CalorieBalance, IsoDate } from '@fitness/types';

import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';

import { BaseService } from './base.service';

export class CaloriesService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/calories', client);
  }

  async today(date: IsoDate): Promise<CalorieBalance> {
    const { data } = await this.client.get<CalorieBalance>(
      this.url('today', date),
    );
    return data;
  }

  async range(from: IsoDate, to: IsoDate): Promise<CalorieBalance[]> {
    const { data } = await this.client.get<CalorieBalance[]>(this.url('range'), {
      params: { from, to },
    });
    return data;
  }
}

export const caloriesService = new CaloriesService();
