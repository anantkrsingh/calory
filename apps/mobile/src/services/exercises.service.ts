import type { Exercise, ExerciseCatalogue } from '@fitness/types';
import type { ExerciseByMuscleQueryInput } from '@fitness/validation';
import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';

import { BaseService } from './base.service';

export class ExercisesService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/exercises', client);
  }

  /** Catalogue + the caller's own custom exercises, grouped by primary muscle,
   * with the caller's favorites pinned above the groups. */
  async byMuscle(
    query: ExerciseByMuscleQueryInput = {},
  ): Promise<ExerciseCatalogue> {
    const { data } = await this.client.get<ExerciseCatalogue>(
      this.url('by-muscle'),
      { params: query },
    );
    return data;
  }

  async get(id: string): Promise<Exercise> {
    const { data } = await this.client.get<Exercise>(this.url(id));
    return data;
  }

  async addFavorite(id: string): Promise<Exercise> {
    const { data } = await this.client.put<Exercise>(this.url(id, 'favorite'));
    return data;
  }

  async removeFavorite(id: string): Promise<Exercise> {
    const { data } = await this.client.delete<Exercise>(this.url(id, 'favorite'));
    return data;
  }
}

export const exercisesService = new ExercisesService();
