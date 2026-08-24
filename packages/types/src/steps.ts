import type { Entity, Id, IsoDate } from './common';

/** One day's step count, keyed by (userId, date). */
export interface DailySteps extends Entity {
  userId: Id;
  date: IsoDate;
  steps: number;
}

/** Today's steps against the daily goal — what the home widget renders. */
export interface StepsSummary {
  date: IsoDate;
  steps: number;
  goal: number;
}
