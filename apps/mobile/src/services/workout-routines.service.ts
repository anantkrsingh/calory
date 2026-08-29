import type { IsoDate, TodayRoutine, WorkoutRoutine } from '@fitness/types';
import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';

import { BaseService } from './base.service';

export class WorkoutRoutinesService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/workout-routines', client);
  }

  /** The caller's current AI-generated weekly routine (whatever its status). */
  async me(): Promise<WorkoutRoutine> {
    const { data } = await this.client.get<WorkoutRoutine>(this.url('me'));
    return data;
  }

  /** Today's plan (steps + calorie targets) layered with real progress so far. */
  async today(date: IsoDate): Promise<TodayRoutine> {
    const { data } = await this.client.get<TodayRoutine>(
      this.url('today', date),
    );
    return data;
  }

  async regenerate(): Promise<WorkoutRoutine> {
    const { data } = await this.client.post<WorkoutRoutine>(
      this.url('regenerate'),
    );
    return data;
  }
}

export const workoutRoutinesService = new WorkoutRoutinesService();
