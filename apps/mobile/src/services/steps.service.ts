import type { DailySteps, IsoDate, StepsSummary } from '@fitness/types';

import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';

import { BaseService } from './base.service';

export class StepsService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/steps', client);
  }

  async get(date: IsoDate): Promise<StepsSummary> {
    const { data } = await this.client.get<StepsSummary>(this.url(date));
    return data;
  }

  async range(from: IsoDate, to: IsoDate): Promise<DailySteps[]> {
    const { data } = await this.client.get<DailySteps[]>(this.url(), {
      params: { from, to },
    });
    return data;
  }

  /** Idempotent — safe to call repeatedly as the on-device count climbs through the day. */
  async upsert(date: IsoDate, steps: number): Promise<DailySteps> {
    const { data } = await this.client.put<DailySteps>(this.url(date), { steps });
    return data;
  }
}

export const stepsService = new StepsService();
