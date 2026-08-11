import type { Entity, Id } from './common';

export interface Plan extends Entity {
  name: string;
  description?: string;
  duration: string;
  durationDays?: number;
  price: number;
  currency: string;
  benefits: string[];
  storeProductId?: string;
  isActive: boolean;
}
