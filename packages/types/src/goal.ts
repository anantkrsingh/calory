import type { Entity, Id, IsoDate, IsoDateTime } from './common';
import type { GoalStatus, GoalType } from './enums';

export interface Goal extends Entity {
  userId: Id;
  type: GoalType;
  title: string;
  targetValue: number;
  startValue: number;
  currentValue: number;
  /** Unit label for display, e.g. `kg`, `%`, `workouts/week`. */
  unit: string;
  deadline?: IsoDate;
  status: GoalStatus;
  achievedAt?: IsoDateTime;
  /** Required for `exercise_one_rep_max` goals. */
  exerciseId?: Id;
}

export interface GoalProgress {
  goalId: Id;
  /** 0–100, clamped. Handles both increasing and decreasing targets. */
  percentage: number;
  remaining: number;
  isOnTrack: boolean;
}
