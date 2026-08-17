import type { DailyQuote } from '@fitness/types';

import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';

import { BaseService } from './base.service';

export class QuotesService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/quotes', client);
  }

  /** Today's quote, or the most recent one if today's is not ready yet. */
  async today(): Promise<DailyQuote> {
    const { data } = await this.client.get<DailyQuote>(this.url('today'));
    return data;
  }
}

export const quotesService = new QuotesService();
