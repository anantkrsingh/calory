import type { BodyMeasurement } from '@fitness/types';
import type { CreateMeasurementInput } from '@fitness/validation';

import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';

import { BaseService } from './base.service';

export class MeasurementsService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/measurements', client);
  }

  async create(input: CreateMeasurementInput): Promise<BodyMeasurement> {
    const { data } = await this.client.post<BodyMeasurement>(this.url(), input);
    return data;
  }
}

export const measurementsService = new MeasurementsService();
