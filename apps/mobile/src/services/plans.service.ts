import type { Plan } from '@fitness/types';
import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';
import { BaseService } from './base.service';

export class PlansService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/plans', client);
  }

  async list(activeOnly = true): Promise<Plan[]> {
    const { data } = await this.client.get<Plan[]>(this.url(), {
      params: activeOnly ? { activeOnly: 'true' } : {},
    });
    return data;
  }

  async get(id: string): Promise<Plan> {
    const { data } = await this.client.get<Plan>(this.url(id));
    return data;
  }
}

export const plansService = new PlansService();
