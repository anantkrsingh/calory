import { PAGINATION } from '@fitness/config';
import { z } from 'zod';

/** A MongoDB ObjectId in its 24-char hex form. */
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id');

/**
 * Client-generated ids (offline set/exercise rows) are UUIDs, while anything
 * that has round-tripped through Mongo is an ObjectId. Accept both.
 */
export const clientIdSchema = z.union([objectIdSchema, z.uuid()]);

export const isoDateTimeSchema = z.iso.datetime({ offset: true });

export const isoDateSchema = z.iso.date();

export const sortOrderSchema = z.enum(['asc', 'desc']);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION.defaultPage),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.maxLimit)
    .default(PAGINATION.defaultLimit),
});

export type PaginationQueryInput = z.input<typeof paginationQuerySchema>;
export type PaginationQueryOutput = z.output<typeof paginationQuerySchema>;

/**
 * Flattens a ZodError into the `details` map the API's exception filter returns,
 * so both sides agree on the error shape.
 */
export function formatIssues(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_root';
    (details[key] ??= []).push(issue.message);
  }

  return details;
}

export class ValidationError extends Error {
  readonly details: Record<string, string[]>;

  constructor(error: z.ZodError, message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
    this.details = formatIssues(error);
  }
}

/** Parses `input`, throwing a `ValidationError` carrying field-level details. */
export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  return result.data;
}
