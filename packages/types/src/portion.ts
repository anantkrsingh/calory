import type { Entity, Id, IsoDateTime } from './common';

/**
 * A common food expressed in household portions — "1 katori dal", "2 roti" —
 * rather than grams. Nobody weighs home cooking, so the unit is the bowl or
 * the bread, and `gramsPerUnit` is shown only as a reference.
 *
 * Admin-editable, so the catalogue can be tuned per market.
 */
export interface PortionFood extends Entity {
  name: string;
  /** e.g. "roti", "katori", "glass", "piece". */
  unit: string;
  gramsPerUnit?: number;
  /** Macros for exactly one unit. */
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  sortOrder: number;
  isActive: boolean;
}

/** One off-plan food entry on a calendar day. Macros are snapshotted at log
 * time, so editing the catalogue later never rewrites history. */
export interface LoggedPortion {
  id: Id;
  portionId?: Id;
  name: string;
  unit: string;
  quantity: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  loggedAt: IsoDateTime;
}
