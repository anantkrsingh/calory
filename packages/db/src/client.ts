import { PrismaClient } from '@prisma/client';

export interface PrismaClientOptions {
  /** Defaults to `process.env.MONGODB_URI`. */
  url?: string;
  log?: Array<'query' | 'info' | 'warn' | 'error'>;
}

/**
 * Cached across calls so a hot-reloading dev server (Nest watch mode) does not
 * open a fresh connection pool on every rebuild.
 */
let cached: PrismaClient | null = null;

export function createPrismaClient(
  options: PrismaClientOptions = {},
): PrismaClient {
  const url = options.url ?? process.env['MONGODB_URI'];

  if (!url) {
    throw new Error(
      'MONGODB_URI is not set — pass `url` explicitly or define it in the environment.',
    );
  }

  const isDev = process.env['NODE_ENV'] === 'development';

  return new PrismaClient({
    datasources: { db: { url } },
    log: options.log ?? (isDev ? ['warn', 'error'] : ['error']),
  });
}

/** Returns the process-wide client, creating it on first use. */
export function getPrismaClient(
  options: PrismaClientOptions = {},
): PrismaClient {
  cached ??= createPrismaClient(options);
  return cached;
}

export async function disconnectPrisma(): Promise<void> {
  if (!cached) return;
  await cached.$disconnect();
  cached = null;
}

export { PrismaClient, Prisma } from '@prisma/client';
