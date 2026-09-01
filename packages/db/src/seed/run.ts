import 'dotenv/config';

import { createPrismaClient } from '../client';
import {
  defaultLogFieldsForCategory,
  EXERCISE_CATALOGUE,
  PLACEHOLDER_GALLERY,
  PLACEHOLDER_THUMBNAIL,
} from './exercises';

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
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
