import type { Entity, Id } from './common';
import type { Equipment, ExerciseCategory, MuscleGroup } from './enums';

export interface Exercise extends Entity {
  name: string;
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  instructions?: string;
  /** Main / list thumbnail image (Cloudinary URL). */
  thumbnail?: string;
  /** Additional gallery images (Cloudinary URLs). */
  images: string[];
  /** `null` for the built-in catalogue, a user id for custom exercises. */
  createdBy: Id | null;
  isCustom: boolean;
}

export interface ExerciseFilters {
  search?: string;
  category?: ExerciseCategory;
  muscleGroup?: MuscleGroup;
  equipment?: Equipment;
  /** Restrict to the caller's own custom exercises. */
  customOnly?: boolean;
}

/** Aggregated personal-record data for one exercise. */
export interface ExercisePersonalRecord {
  exerciseId: Id;
  exerciseName: string;
  bestWeightKg?: number;
  bestReps?: number;
  bestEstimatedOneRepMaxKg?: number;
  bestVolumeKg?: number;
  bestDistanceM?: number;
  bestDurationSec?: number;
  achievedAt: string;
}
