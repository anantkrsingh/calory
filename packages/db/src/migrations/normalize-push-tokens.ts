import 'dotenv/config';

import type { Prisma } from '@prisma/client';

import { createPrismaClient } from '../client';

/**
 * One-off backfill for the `User.pushTokens` shape change: entries used to be
 * plain Expo token strings; they're now `{ token, platform }` objects so an
 * admin campaign can target iOS-only or Android-only sends (see
 * `PushToken` in `schema.prisma`). Mongo is schemaless, so any user who
 * registered a device before this change still has raw strings in that
 * array — `findRaw` reads past the current Prisma schema to see them.
 *
 * Each legacy string is wrapped as `{ token, platform: null }`; `platform`
 * stays null until that device's app re-registers (which it does
 * automatically next launch — see `useRegisterPushNotifications`), so a
 * legacy token still gets an "all" send but not an iOS-only/Android-only one.
 *
 * Idempotent and safe to re-run: a user whose tokens are already objects is
 * skipped.
 *
 *   pnpm --filter @fitness/db build
 *   pnpm --filter @fitness/db db:migrate:push-tokens
 */

interface LegacyUserDoc {
  _id: { $oid: string } | string;
  pushTokens?: unknown[];
}

type NormalizedPushToken = { token: string; platform: 'ios' | 'android' | null };

function toIdString(id: { $oid: string } | string): string {
  return typeof id === 'string' ? id : id.$oid;
}

/** A legacy raw token string, or an already-migrated `{ token, platform }`
 * object (some other device on this account may have re-registered before
 * this ran) — either way, comes out the same normalized shape. Anything else
 * is dropped rather than risk writing back garbage. */
function normalizeEntry(entry: unknown): NormalizedPushToken | null {
  if (typeof entry === 'string') return { token: entry, platform: null };

  if (entry && typeof entry === 'object' && 'token' in entry) {
    const { token, platform } = entry as { token: unknown; platform?: unknown };
    if (typeof token !== 'string') return null;
    return {
      token,
      platform: platform === 'ios' || platform === 'android' ? platform : null,
    };
  }

  return null;
}

async function main(): Promise<void> {
  const prisma = createPrismaClient();

  try {
    const raw = (await prisma.user.findRaw({
      filter: { pushTokens: { $elemMatch: { $type: 'string' } } },
    })) as unknown as LegacyUserDoc[];

    console.log(`Found ${raw.length} user(s) with a legacy push token entry.`);

    let migrated = 0;
    let failed = 0;

    for (const doc of raw) {
      const userId = toIdString(doc._id);

      try {
        const normalized = (doc.pushTokens ?? [])
          .map(normalizeEntry)
          .filter((entry): entry is NormalizedPushToken => entry !== null);

        await prisma.$runCommandRaw({
          update: 'users',
          updates: [
            {
              q: { _id: { $oid: userId } },
              u: { $set: { pushTokens: normalized as unknown as Prisma.InputJsonValue } },
            },
          ],
        });

        migrated += 1;
      } catch (error) {
        failed += 1;
        console.error(
          `User ${userId} failed to migrate: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    console.log(`Done: ${migrated} migrated, ${failed} failed.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});
