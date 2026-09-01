import type {
  Equipment,
  ExerciseCategory,
  ExerciseLogFields,
  MuscleGroup,
} from '@fitness/types';

export interface CatalogueExercise {
  name: string;
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  instructions?: string;
  /** Falls back to `PLACEHOLDER_THUMBNAIL` in run.ts when omitted. */
  thumbnail?: string;
  /** Falls back to `PLACEHOLDER_GALLERY` in run.ts when omitted. */
  images?: string[];
}

/**
 * Starting point for a freshly-seeded exercise's `logFields` — a sensible
 * guess from its `category`, since that's all the seed data has to go on.
 * Purely a default: admins can (and for exceptions like running, should)
 * refine it per exercise afterwards, and reseeding never overwrites an
 * exercise that already exists (see `run.ts`).
 */
export function defaultLogFieldsForCategory(
  category: ExerciseCategory,
): ExerciseLogFields {
  switch (category) {
    case 'strength':
      return {
        reps: 'required',
        weightKg: 'required',
        sets: 'required',
        durationSec: 'hidden',
        distanceM: 'hidden',
      };
    case 'cardio':
      return {
        reps: 'hidden',
        weightKg: 'hidden',
        sets: 'hidden',
        durationSec: 'required',
        distanceM: 'optional',
      };
    case 'duration':
      return {
        reps: 'hidden',
        weightKg: 'hidden',
        sets: 'optional',
        durationSec: 'required',
        distanceM: 'hidden',
      };
    case 'reps':
      return {
        reps: 'required',
        weightKg: 'hidden',
        sets: 'required',
        durationSec: 'hidden',
        distanceM: 'hidden',
      };
  }
}

/** Stand-in art until every catalogue exercise has real photography. */
export const PLACEHOLDER_THUMBNAIL =
  'https://res.cloudinary.com/duhuphymw/image/upload/v1786453646/fitness-tracker/exercises/pyedf2x9cuxqkzwasnpr.webp';

export const PLACEHOLDER_GALLERY = [
  'https://res.cloudinary.com/duhuphymw/image/upload/v1786453612/fitness-tracker/exercises/clvzbgvudccobtxmoyom.webp',
  'https://res.cloudinary.com/duhuphymw/image/upload/v1786453618/fitness-tracker/exercises/cqmmvf7cbhcdyewt7c3w.webp',
];

/** The built-in exercise catalogue — shared by every user, `createdById: null`. */
export const EXERCISE_CATALOGUE: CatalogueExercise[] = [
  {
    name: 'Barbell Back Squat',
    category: 'strength',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings', 'core'],
    equipment: 'barbell',
    instructions:
      'Brace the core, descend until the hip crease passes below the knee, then drive up through mid-foot.',
  },
  {
    name: 'Barbell Deadlift',
    category: 'strength',
    primaryMuscles: ['hamstrings', 'glutes', 'back'],
    secondaryMuscles: ['forearms', 'core'],
    equipment: 'barbell',
    instructions:
      'Set the bar over mid-foot, take the slack out, and push the floor away while keeping the spine neutral.',
  },
  {
    name: 'Barbell Bench Press',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'barbell',
    instructions:
      'Retract the shoulder blades, lower to the sternum under control, and press back to lockout.',
  },
  {
    name: 'Overhead Press',
    category: 'strength',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps', 'core'],
    equipment: 'barbell',
  },
  {
    name: 'Barbell Row',
    category: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'forearms'],
    equipment: 'barbell',
  },
  {
    name: 'Romanian Deadlift',
    category: 'strength',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['glutes', 'back'],
    equipment: 'barbell',
  },
  {
    name: 'Front Squat',
    category: 'strength',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['core', 'glutes'],
    equipment: 'barbell',
  },
  {
    name: 'Dumbbell Bench Press',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'dumbbell',
  },
  {
    name: 'Dumbbell Shoulder Press',
    category: 'strength',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
  },
  {
    name: 'Dumbbell Lateral Raise',
    category: 'strength',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: [],
    equipment: 'dumbbell',
  },
  {
    name: 'Dumbbell Bicep Curl',
    category: 'strength',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    equipment: 'dumbbell',
  },
  {
    name: 'Dumbbell Lunge',
    category: 'strength',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    equipment: 'dumbbell',
  },
  {
    name: 'Kettlebell Swing',
    category: 'strength',
    primaryMuscles: ['glutes', 'hamstrings'],
    secondaryMuscles: ['core', 'back'],
    equipment: 'kettlebell',
  },
  {
    name: 'Lat Pulldown',
    category: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
  },
  {
    name: 'Seated Cable Row',
    category: 'strength',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'forearms'],
    equipment: 'cable',
  },
  {
    name: 'Cable Tricep Pushdown',
    category: 'strength',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    equipment: 'cable',
  },
  {
    name: 'Leg Press',
    category: 'strength',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    equipment: 'machine',
  },
  {
    name: 'Leg Curl',
    category: 'strength',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    equipment: 'machine',
  },
  {
    name: 'Calf Raise',
    category: 'strength',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    equipment: 'machine',
  },
  {
    name: 'Pull-Up',
    category: 'reps',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'forearms'],
    equipment: 'bodyweight',
  },
  {
    name: 'Push-Up',
    category: 'reps',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'core'],
    equipment: 'bodyweight',
  },
  {
    name: 'Dip',
    category: 'reps',
    primaryMuscles: ['triceps', 'chest'],
    secondaryMuscles: ['shoulders'],
    equipment: 'bodyweight',
  },
  {
    name: 'Plank',
    category: 'duration',
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders'],
    equipment: 'bodyweight',
  },
  {
    name: 'Hanging Leg Raise',
    category: 'reps',
    primaryMuscles: ['core'],
    secondaryMuscles: ['forearms'],
    equipment: 'bodyweight',
  },
  {
    name: 'Band Pull-Apart',
    category: 'reps',
    primaryMuscles: ['shoulders', 'back'],
    secondaryMuscles: [],
    equipment: 'band',
  },
  {
    name: 'Treadmill Run',
    category: 'cardio',
    primaryMuscles: ['cardio'],
    secondaryMuscles: ['quads', 'calves'],
    equipment: 'machine',
  },
  {
    name: 'Outdoor Run',
    category: 'cardio',
    primaryMuscles: ['cardio'],
    secondaryMuscles: ['quads', 'calves'],
    equipment: 'bodyweight',
  },
  {
    name: 'Cycling',
    category: 'cardio',
    primaryMuscles: ['cardio'],
    secondaryMuscles: ['quads', 'glutes'],
    equipment: 'machine',
  },
  {
    name: 'Rowing Machine',
    category: 'cardio',
    primaryMuscles: ['cardio'],
    secondaryMuscles: ['back', 'hamstrings'],
    equipment: 'machine',
  },
  {
    name: 'Jump Rope',
    category: 'duration',
    primaryMuscles: ['cardio'],
    secondaryMuscles: ['calves'],
    equipment: 'other',
  },
];
