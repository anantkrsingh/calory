import 'dotenv/config';

import { createPrismaClient } from '../client';
import {
  defaultLogFieldsForCategory,
  EXERCISE_CATALOGUE,
  PLACEHOLDER_GALLERY,
  PLACEHOLDER_THUMBNAIL,
} from './exercises';
import { PORTION_FOOD_SEED } from './portion-foods';

/**
 * Idempotent seed for the shared exercise catalogue. Re-running it updates
 * existing rows rather than duplicating them, so it is safe on every deploy.
 *
 * Entries without their own `thumbnail`/`images` get the shared placeholder
 * art until real photography is uploaded per exercise.
 */
async function main(): Promise<void> {
  const prisma = createPrismaClient();

  try {
    let created = 0;
    let updated = 0;

    for (const exercise of EXERCISE_CATALOGUE) {
      const data = {
        ...exercise,
        thumbnail: exercise.thumbnail ?? PLACEHOLDER_THUMBNAIL,
        images: exercise.images ?? PLACEHOLDER_GALLERY,
      };

      const existing = await prisma.exercise.findFirst({
        where: { name: exercise.name, createdById: null },
        select: { id: true },
      });

      if (existing) {
        await prisma.exercise.update({
          where: { id: existing.id },
          data: { ...data, isCustom: false },
        });
        updated += 1;
      } else {
        await prisma.exercise.create({
          data: {
            ...data,
            createdById: null,
            isCustom: false,
            // Only on first insert — an admin may have already tuned this
            // exercise's `logFields`, and a reseed must not clobber it.
            logFields: defaultLogFieldsForCategory(exercise.category),
          },
        });
        created += 1;
      }
    }

    console.log(
      `Seeded exercise catalogue: ${created} created, ${updated} updated.`,
    );

    // Household-portion catalogue for off-plan food logging. Only created on
    // first run — an admin may have retuned the macros, and a reseed must not
    // clobber that. New entries added to the seed still land.
    let portionsCreated = 0;
    for (const food of PORTION_FOOD_SEED) {
      const existing = await prisma.portionFood.findFirst({
        where: { name: food.name, unit: food.unit },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.portionFood.create({ data: food });
      portionsCreated += 1;
    }

    console.log(
      `Seeded portion foods: ${portionsCreated} created, ${
        PORTION_FOOD_SEED.length - portionsCreated
      } already present.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
