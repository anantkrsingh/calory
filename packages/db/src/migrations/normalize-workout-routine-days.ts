import 'dotenv/config';

import type { DayOfWeek, RoutineDayStatus } from '@fitness/types';

import { createPrismaClient } from '../client';

/**
 * One-off backfill for the `WorkoutRoutine.days` normalization: routines
 * written before `RoutineDay`/`RoutineDayExercise` existed still have their
 * week embedded as a raw `days` array on the `workout_routines` document
 * (Mongo is schemaless, so that field is still there even though the current
 * Prisma schema no longer declares it — `findRaw` reads past the schema to
 * see it). This copies each one into the new collections, then drops the
 * legacy field.
 *
 * Idempotent and safe to re-run: a routine that already has `RoutineDay`
 * rows, or has no legacy `days` left, is skipped.
 *
 *   pnpm --filter @fitness/db build
 *   pnpm --filter @fitness/db db:migrate:routine-days
 */

/** Loose shape of the legacy embedded documents — never fully trusted, only
 * probed defensively field by field. */
interface LegacyExercise {
  exerciseId?: unknown;
  exerciseName?: unknown;
  sets?: unknown;
  reps?: unknown;
  durationSec?: unknown;
  restSeconds?: unknown;
  estimatedCalories?: unknown;
}

interface LegacyDay {
  dayOfWeek?: unknown;
  status?: unknown;
  targetCaloriesBurned?: unknown;
  caloriesFromRunning?: unknown;
  caloriesFromExercises?: unknown;
  stepsTarget?: unknown;
  runningDistanceKm?: unknown;
  runningDurationMin?: unknown;
  focus?: unknown;
  exercises?: unknown;
}

interface LegacyRoutineDoc {
  _id: { $oid: string } | string;
  days?: LegacyDay[];
}

const DAYS_OF_WEEK = new Set([
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]);

function toIdString(id: { $oid: string } | string): string {
  return typeof id === 'string' ? id : id.$oid;
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function toIntOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.trunc(value)
    : null;
}

function toFloatOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

async function main(): Promise<void> {
  const prisma = createPrismaClient();

  try {
    const raw = (await prisma.workoutRoutine.findRaw({
      filter: { days: { $exists: true, $ne: [] } },
    })) as unknown as LegacyRoutineDoc[];

    console.log(`Found ${raw.length} routine(s) with a legacy embedded days array.`);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const doc of raw) {
      const routineId = toIdString(doc._id);

      try {
        const alreadyMigrated = await prisma.routineDay.count({
          where: { routineId },
        });
        if (alreadyMigrated > 0) {
          skipped += 1;
          continue;
        }

        const legacyDays = doc.days ?? [];
        if (legacyDays.length === 0) {
          skipped += 1;
          continue;
        }

        await prisma.$transaction(
          legacyDays.map((day, dayIndex) => {
            const dayOfWeek = toStringOrNull(day.dayOfWeek);
            const legacyExercises: LegacyExercise[] = Array.isArray(
              day.exercises,
            )
              ? day.exercises
              : [];

            return prisma.routineDay.create({
              data: {
                routineId,
                order: dayIndex,
                // A day with an unrecognized/missing weekday can't be placed
                // — default to Sunday rather than drop the whole routine.
                dayOfWeek: (DAYS_OF_WEEK.has(dayOfWeek ?? '')
                  ? dayOfWeek
                  : 'sunday') as DayOfWeek,
                status: (day.status === 'rest' ? 'rest' : 'active') as RoutineDayStatus,
                targetCaloriesBurned: toIntOrNull(day.targetCaloriesBurned) ?? 0,
                caloriesFromRunning: toIntOrNull(day.caloriesFromRunning),
                caloriesFromExercises: toIntOrNull(day.caloriesFromExercises),
                stepsTarget: toIntOrNull(day.stepsTarget),
                runningDistanceKm: toFloatOrNull(day.runningDistanceKm),
                runningDurationMin: toIntOrNull(day.runningDurationMin),
                focus: toStringOrNull(day.focus) ?? '',
                exercises: {
                  create: legacyExercises
                    .filter((exercise) => toStringOrNull(exercise.exerciseId))
                    .map((exercise, exerciseIndex) => ({
                      order: exerciseIndex,
                      exerciseId: toStringOrNull(exercise.exerciseId)!,
                      exerciseName: toStringOrNull(exercise.exerciseName) ?? '',
                      sets: toIntOrNull(exercise.sets) ?? 1,
                      reps: toIntOrNull(exercise.reps),
                      durationSec: toIntOrNull(exercise.durationSec),
                      restSeconds: toIntOrNull(exercise.restSeconds),
                      estimatedCalories: toIntOrNull(exercise.estimatedCalories),
                    })),
                },
              },
            });
          }),
        );

        // Only drop the legacy field once the replacement is safely written.
        await prisma.$runCommandRaw({
          update: 'workout_routines',
          updates: [
            {
              q: { _id: { $oid: routineId } },
              u: { $unset: { days: '' } },
            },
          ],
        });

        migrated += 1;
      } catch (error) {
        failed += 1;
        console.error(
          `Routine ${routineId} failed to migrate: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    console.log(
      `Done: ${migrated} migrated, ${skipped} already up to date, ${failed} failed.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});
