import type { Workout } from '@fitness/types';
import type { CompleteWorkoutInput, CreateWorkoutInput } from '@fitness/validation';
import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';

import { BaseService } from './base.service';

export class WorkoutsService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/workouts', client);
  }

  async create(input: CreateWorkoutInput): Promise<Workout> {
    const { data } = await this.client.post<Workout>(this.url(), input);
    return data;
  }

  async complete(id: string, input: CompleteWorkoutInput): Promise<Workout> {
    const { data } = await this.client.post<Workout>(
      this.url(id, 'complete'),
      input,
    );
    return data;
  }
}

export const workoutsService = new WorkoutsService();
