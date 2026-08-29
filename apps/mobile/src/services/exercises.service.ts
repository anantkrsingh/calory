import type { Exercise, ExerciseMuscleGroup } from '@fitness/types';
import type { ExerciseByMuscleQueryInput } from '@fitness/validation';
import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';

import { BaseService } from './base.service';

export class ExercisesService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/exercises', client);
  }

  /** Catalogue + the caller's own custom exercises, grouped by primary muscle. */
  async byMuscle(
    query: ExerciseByMuscleQueryInput = {},
  ): Promise<ExerciseMuscleGroup[]> {
    const { data } = await this.client.get<ExerciseMuscleGroup[]>(
      this.url('by-muscle'),
      { params: query },
    );
    return data;
  }

  async get(id: string): Promise<Exercise> {
    const { data } = await this.client.get<Exercise>(this.url(id));
    return data;
  }
}

export const exercisesService = new ExercisesService();
