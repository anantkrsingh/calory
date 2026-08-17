import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';

import { BaseService } from './base.service';

export type TodayCalories = {
  burned: number;
  target: number;
};

/** Temporary stand-in until calorie tracking is wired to real APIs. */
const MOCK_TODAY_CALORIES: TodayCalories = {
  burned: 320,
  target: 500,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class WorkoutRoutinesService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/workout-routines', client);
  }

  /** Today's burned / target calories. Mocked for home UI. */
  async todayCalories(): Promise<TodayCalories> {
    await delay(150);
    return MOCK_TODAY_CALORIES;
  }
}

export const workoutRoutinesService = new WorkoutRoutinesService();
