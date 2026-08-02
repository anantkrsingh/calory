import { PAGINATION } from '@fitness/config';
import type { Paginated, PaginationMeta } from '@fitness/types';

export interface PageArgs {
  page?: number;
  limit?: number;
}

export interface SkipTake {
  skip: number;
  take: number;
}

/** Clamps user input and converts page/limit into Prisma's skip/take. */
export function toSkipTake(args: PageArgs = {}): SkipTake {
  const page = Math.max(1, Math.trunc(args.page ?? PAGINATION.defaultPage));
  const limit = Math.min(
    PAGINATION.maxLimit,
    Math.max(1, Math.trunc(args.limit ?? PAGINATION.defaultLimit)),
  );

  return { skip: (page - 1) * limit, take: limit };
}

export function buildMeta(
  args: PageArgs,
  total: number,
): PaginationMeta {
  const { take } = toSkipTake(args);
  const page = Math.max(1, Math.trunc(args.page ?? PAGINATION.defaultPage));
  const totalPages = total === 0 ? 0 : Math.ceil(total / take);

  return {
    page,
    limit: take,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && total > 0,
  };
}

export function paginate<T>(
  items: T[],
  args: PageArgs,
  total: number,
): Paginated<T> {
  return { items, meta: buildMeta(args, total) };
}
