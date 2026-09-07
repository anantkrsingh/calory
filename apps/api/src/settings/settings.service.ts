import { Injectable } from '@nestjs/common';
import { toAppSettings } from '@fitness/db';
import type {
  ActivityLevel,
  AppSettings,
  ExerciseCategory,
  FitnessGoal,
} from '@fitness/types';
import type {
  CalorieConfigInput,
  UpdateSettingsInput,
} from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';

/**
 * The engine keys its overrides by enum; Mongo composite types have fixed
 * fields, so they persist as lists. Undefined stays undefined — a field the
 * admin left blank must fall back to the researched default, not to zero.
 */
function toStoredCalorieConfig(config: CalorieConfigInput | undefined) {
  if (!config) return undefined;

  return {
    categoryMets: Object.entries(config.categoryMets ?? {}).map(
      ([category, met]) => ({ category: category as ExerciseCategory, met }),
    ),
    activityMultipliers: Object.entries(config.activityMultipliers ?? {}).map(
      ([activityLevel, multiplier]) => ({
        activityLevel: activityLevel as ActivityLevel,
        multiplier,
      }),
    ),
    goalAdjustments: Object.entries(config.goalAdjustments ?? {}).map(
      ([goal, adjustment]) => ({ goal: goal as FitnessGoal, adjustment }),
    ),
    kcalPerStepPerKg: config.kcalPerStepPerKg ?? null,
    secondsPerSet: config.secondsPerSet ?? null,
    defaultRestSeconds: config.defaultRestSeconds ?? null,
    restMetFraction: config.restMetFraction ?? null,
    minIntakeMale: config.minIntakeMale ?? null,
    minIntakeFemale: config.minIntakeFemale ?? null,
  };
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** There is always exactly one settings row; create it with defaults on first read. */
  async get(): Promise<AppSettings> {
    const existing = await this.prisma.appSettings.findFirst();
    if (existing) return toAppSettings(existing);

    const created = await this.prisma.appSettings.create({
      data: { freeChatsLimit: 5, aiPrompts: [] },
    });
    return toAppSettings(created);
  }

  async update(input: UpdateSettingsInput): Promise<AppSettings> {
    const current = await this.prisma.appSettings.findFirst();

    const { calorieConfig, ...rest } = input;
    const data = {
      ...rest,
      ...(calorieConfig !== undefined
        ? { calorieConfig: toStoredCalorieConfig(calorieConfig) }
        : {}),
    };

    const updated = current
      ? await this.prisma.appSettings.update({
          where: { id: current.id },
          data,
        })
      : await this.prisma.appSettings.create({
          data: { freeChatsLimit: 5, aiPrompts: [], ...data },
        });

    return toAppSettings(updated);
  }
}
