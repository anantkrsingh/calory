
export const API_PREFIX = 'api';

export const API_VERSION = 'v1';

export const AUTH = {
  headerName: 'authorization',
  scheme: 'Bearer',
  minPasswordLength: 8,
  maxPasswordLength: 128,
} as const;

export const LIMITS = {
  name: { min: 1, max: 120 },
  heightCm: { min: 50, max: 300 },
  bodyWeightKg: { min: 20, max: 500 },
  dietMealsPerDay: { min: 2, max: 6, default: 4 },
  dietExcludedFood: { min: 1, max: 60 },
  dietExclusions: { max: 30 },
} as const;

export const UNIT_CONVERSION = {
  kgPerLb: 0.45359237,
  cmPerInch: 2.54,
} as const;

export const DEFAULT_DAILY_STEPS_GOAL = 10_000;
