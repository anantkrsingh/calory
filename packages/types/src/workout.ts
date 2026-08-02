import type { Entity, Id, IsoDateTime } from './common';
import type { SetType, WorkoutStatus } from './enums';
import type { Exercise } from './exercise';

/**
 * One logged set. Which fields are populated depends on the parent exercise's
 * `ExerciseCategory` — a cardio set carries duration/distance, not reps/weight.
 */
export interface WorkoutSet {
  /** Client-generated so offline-logged sets keep a stable identity. */
  id: Id;
  order: number;
  type: SetType;
  reps?: number;
  weightKg?: number;
  durationSec?: number;
  distanceM?: number;
  /** Rate of perceived exertion, 1–10. */
  rpe?: number;
  completed: boolean;
  notes?: string;
}

export interface WorkoutExercise {
  id: Id;
  exerciseId: Id;
  /** Denormalised for offline display; the catalogue remains the source of truth. */
  exerciseName: string;
  order: number;
  sets: WorkoutSet[];
  restSeconds?: number;
  notes?: string;
}

/** Derived totals; computed server-side on completion, never client-supplied. */
export interface WorkoutStats {
  totalSets: number;
  completedSets: number;
  totalVolumeKg: number;
  totalReps: number;
  totalDistanceM: number;
  totalDurationSec: number;
}

export interface Workout extends Entity {
  userId: Id;
  name: string;
  status: WorkoutStatus;
  startedAt: IsoDateTime;
  completedAt?: IsoDateTime;
  /** Elapsed wall-clock time, excluding pauses. */
  durationSec?: number;
  exercises: WorkoutExercise[];
  stats: WorkoutStats;
  notes?: string;
  /** Set when the workout was started from a routine template. */
  routineId?: Id;
}

/** List-view projection — omits the full set tree to keep payloads small. */
export interface WorkoutSummary {
  id: Id;
  name: string;
  status: WorkoutStatus;
  startedAt: IsoDateTime;
  completedAt?: IsoDateTime;
  durationSec?: number;
  exerciseCount: number;
  stats: WorkoutStats;
}

export interface WorkoutFilters {
  status?: WorkoutStatus;
  from?: IsoDateTime;
  to?: IsoDateTime;
  exerciseId?: Id;
}

/** A workout with its exercise catalogue entries resolved. */
export interface WorkoutWithExercises extends Omit<Workout, 'exercises'> {
  exercises: Array<WorkoutExercise & { exercise: Exercise | null }>;
}
