import type { Id, IsoDate, IsoDateTime } from './common';
import type { MuscleGroup } from './enums';

export interface WorkoutStreak {
  currentDays: number;
  longestDays: number;
  lastWorkoutAt?: IsoDateTime;
}

export interface VolumeByMuscleGroup {
  muscleGroup: MuscleGroup;
  volumeKg: number;
  setCount: number;
}

export interface DailyActivity {
  date: IsoDate;
  workoutCount: number;
  volumeKg: number;
  durationSec: number;
}

/** Payload backing the mobile home screen. */
export interface DashboardStats {
  userId: Id;
  workoutsThisWeek: number;
  weeklyTarget: number;
  totalWorkouts: number;
  totalVolumeKg: number;
  totalDurationSec: number;
  streak: WorkoutStreak;
  volumeByMuscleGroup: VolumeByMuscleGroup[];
  recentActivity: DailyActivity[];
}

export interface StatsRange {
  from: IsoDate;
  to: IsoDate;
}
