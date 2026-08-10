import { Injectable } from '@nestjs/common';
import { toAppSettings } from '@fitness/db';
import type { AppSettings } from '@fitness/types';
import type { UpdateSettingsInput } from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';

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

    const updated = current
      ? await this.prisma.appSettings.update({
          where: { id: current.id },
          data: input,
        })
      : await this.prisma.appSettings.create({
          data: { freeChatsLimit: 5, aiPrompts: [], ...input },
        });

    return toAppSettings(updated);
  }
}
