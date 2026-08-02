/** MongoDB ObjectId, serialised as a 24-character hex string across the wire. */
export type Id = string;

/** ISO-8601 date-time string. Dates are never sent as `Date` over JSON. */
export type IsoDateTime = string;

/** ISO-8601 calendar date, `YYYY-MM-DD`. */
export type IsoDate = string;

export interface Timestamps {
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** Every persisted document exposes a string `id` (never the raw `_id`). */
export interface Entity extends Timestamps {
  id: Id;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export type SortOrder = 'asc' | 'desc';

/** Shape returned by the API's global exception filter. */
export interface ApiErrorBody {
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: IsoDateTime;
  /** Field-level failures, keyed by dotted path, when validation rejects a body. */
  details?: Record<string, string[]>;
}
