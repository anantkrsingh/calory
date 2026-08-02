import type { Entity, Id, IsoDateTime } from './common';
import type { MeasurementSite } from './enums';

/** Circumference readings in centimetres, keyed by body site. */
export type BodyMeasurements = Partial<Record<MeasurementSite, number>>;

export interface BodyMeasurement extends Entity {
  userId: Id;
  recordedAt: IsoDateTime;
  weightKg?: number;
  bodyFatPercentage?: number;
  measurements: BodyMeasurements;
  photoUrls: string[];
  notes?: string;
}

/** A single point on a progress chart. */
export interface MeasurementPoint {
  recordedAt: IsoDateTime;
  value: number;
}

export interface MeasurementTrend {
  metric: 'weightKg' | 'bodyFatPercentage' | MeasurementSite;
  points: MeasurementPoint[];
  /** Change between the first and last point in the window. */
  change: number;
  changePercentage: number;
}
