import type { Entity, Id, IsoDateTime } from './common';
import type { MuscleGroup, SetType } from './enums';

/** A planned set in a template — targets rather than logged results. */
export interface RoutineSet {
  id: Id;
  order: number;
  type: SetType;
  targetReps?: number;
  targetWeightKg?: number;
  targetDurationSec?: number;
  targetDistanceM?: number;
}

export interface RoutineExercise {
  id: Id;
  exerciseId: Id;
  exerciseName: string;
  order: number;
  sets: RoutineSet[];
  restSeconds?: number;
  notes?: string;
}

export interface Routine extends Entity {
  userId: Id;
  name: string;
  description?: string;
  /** Muscle groups the routine covers; derived from its exercises. */
  targetMuscles: MuscleGroup[];
  exercises: RoutineExercise[];
  estimatedDurationSec?: number;
  isArchived: boolean;
  lastPerformedAt?: IsoDateTime;
}

export interface RoutineSummary {
  id: Id;
  name: string;
  description?: string;
  exerciseCount: number;
  targetMuscles: MuscleGroup[];
  estimatedDurationSec?: number;
  lastPerformedAt?: IsoDateTime;
}
