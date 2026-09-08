import type { PortionFood } from '@fitness/types';

import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';

import { BaseService } from './base.service';

export class PortionsService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/portions', client);
  }

  async list(): Promise<PortionFood[]> {
    const { data } = await this.client.get<PortionFood[]>(this.url());
    return data;
  }
}

export const portionsService = new PortionsService();
