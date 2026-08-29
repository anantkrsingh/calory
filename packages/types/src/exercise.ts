import type { Entity, Id } from './common';
import type { Equipment, ExerciseCategory, MuscleGroup } from './enums';

/** One step of an exercise's illustrated how-to — distinct from `Exercise.instructions`
 * (a single free-text description). `image` is a Cloudinary URL, either a fresh
 * upload or one reused from the exercise's own `images` gallery. */
export interface ExerciseInstructionStep {
  /** Client-generated (UUID), same convention as workout/routine set ids. */
  id: string;
  order: number;
  text: string;
  image?: string;
}

export interface Exercise extends Entity {
  name: string;
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  /** Short free-text description shown under the name. */
  instructions?: string;
  /** Ordered, optionally-illustrated step-by-step how-to. */
  instructionSteps: ExerciseInstructionStep[];
  /** Main / list thumbnail image (Cloudinary URL). */
  thumbnail?: string;
  /** Additional gallery images (Cloudinary URLs). */
  images: string[];
  /** `null` for the built-in catalogue, a user id for custom exercises. */
  createdBy: Id | null;
  isCustom: boolean;
}

/** Exercises grouped by one primary muscle. An exercise with several primary
 * muscles (e.g. dips → chest + triceps) appears in more than one group. */
export interface ExerciseMuscleGroup {
  muscle: MuscleGroup;
  exercises: Exercise[];
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
