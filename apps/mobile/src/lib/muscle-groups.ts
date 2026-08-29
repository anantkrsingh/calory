import type { MuscleGroup } from '@fitness/types';

/** Display label for a muscle group enum value, e.g. `full_body` → "Full Body". */
export function muscleGroupLabel(muscle: MuscleGroup): string {
  return muscle
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
