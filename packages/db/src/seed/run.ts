import 'dotenv/config';

import { createPrismaClient } from '../client';
import { EXERCISE_CATALOGUE } from './exercises';

/**
 * Idempotent seed for the shared exercise catalogue. Re-running it updates
 * existing rows rather than duplicating them, so it is safe on every deploy.
 */
async function main(): Promise<void> {
  const prisma = createPrismaClient();

  try {
    let created = 0;
    let updated = 0;

    for (const exercise of EXERCISE_CATALOGUE) {
      const existing = await prisma.exercise.findFirst({
        where: { name: exercise.name, createdById: null },
        select: { id: true },
      });

      if (existing) {
        await prisma.exercise.update({
          where: { id: existing.id },
          data: { ...exercise, isCustom: false },
        });
        updated += 1;
      } else {
        await prisma.exercise.create({
          data: { ...exercise, createdById: null, isCustom: false },
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
