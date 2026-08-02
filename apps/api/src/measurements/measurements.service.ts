import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  paginate,
  toBodyMeasurement,
  toSkipTake,
  type BodyMeasurementRow,
} from '@fitness/db';
import type {
  BodyMeasurement,
  Id,
  MeasurementPoint,
  MeasurementTrend,
  Paginated,
} from '@fitness/types';
import type {
  CreateMeasurementInput,
  MeasurementQueryInput,
  MeasurementTrendQueryInput,
  UpdateMeasurementInput,
} from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeasurementsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: Id,
    query: MeasurementQueryInput,
  ): Promise<Paginated<BodyMeasurement>> {
    const where: Prisma.BodyMeasurementWhereInput = {
      userId,
      ...(query.from || query.to
        ? {
            recordedAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const { skip, take } = toSkipTake(query);

    const [rows, total] = await Promise.all([
      this.prisma.bodyMeasurement.findMany({
        where,
        skip,
        take,
        orderBy: { recordedAt: 'desc' },
      }),
      this.prisma.bodyMeasurement.count({ where }),
    ]);

    return paginate(rows.map(toBodyMeasurement), query, total);
  }

  async findById(userId: Id, id: Id): Promise<BodyMeasurement> {
    return toBodyMeasurement(await this.getOwned(userId, id));
  }

  async findLatest(userId: Id): Promise<BodyMeasurement | null> {
    const row = await this.prisma.bodyMeasurement.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });

    return row ? toBodyMeasurement(row) : null;
  }

  async create(
    userId: Id,
    input: CreateMeasurementInput,
  ): Promise<BodyMeasurement> {
    const row = await this.prisma.bodyMeasurement.create({
      data: {
        userId,
        recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
        measurements: input.measurements,
        photoUrls: input.photoUrls,
        ...(input.weightKg != null ? { weightKg: input.weightKg } : {}),
        ...(input.bodyFatPercentage != null
          ? { bodyFatPercentage: input.bodyFatPercentage }
          : {}),
        ...(input.notes ? { notes: input.notes } : {}),
      },
    });

    return toBodyMeasurement(row);
  }

  async update(
    userId: Id,
    id: Id,
    input: UpdateMeasurementInput,
  ): Promise<BodyMeasurement> {
    const current = await this.getOwned(userId, id);

    const row = await this.prisma.bodyMeasurement.update({
      where: { id },
      data: {
        ...(input.recordedAt ? { recordedAt: new Date(input.recordedAt) } : {}),
        ...(input.weightKg != null ? { weightKg: input.weightKg } : {}),
        ...(input.bodyFatPercentage != null
          ? { bodyFatPercentage: input.bodyFatPercentage }
          : {}),
        // Composite replace: merge so a partial patch keeps untouched sites.
        ...(input.measurements
          ? {
              measurements: {
                ...current.measurements,
                ...input.measurements,
              },
            }
          : {}),
        ...(input.photoUrls ? { photoUrls: input.photoUrls } : {}),
        ...(input.notes != null ? { notes: input.notes } : {}),
      },
    });

    return toBodyMeasurement(row);
  }

  async remove(userId: Id, id: Id): Promise<void> {
    await this.getOwned(userId, id);
    await this.prisma.bodyMeasurement.delete({ where: { id } });
  }

  /** Time series for one metric, plus the change across the window. */
  async trend(
    userId: Id,
    query: MeasurementTrendQueryInput,
  ): Promise<MeasurementTrend> {
    const rows = await this.prisma.bodyMeasurement.findMany({
      where: {
        userId,
        ...(query.from || query.to
          ? {
              recordedAt: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { recordedAt: 'asc' },
    });

    const points: MeasurementPoint[] = [];

    for (const row of rows) {
      const value =
        query.metric === 'weightKg'
          ? row.weightKg
          : query.metric === 'bodyFatPercentage'
            ? row.bodyFatPercentage
            : row.measurements[query.metric];

      if (value != null) {
        points.push({ recordedAt: row.recordedAt.toISOString(), value });
      }
    }

    const first = points[0]?.value;
    const last = points[points.length - 1]?.value;
    const change = first != null && last != null ? last - first : 0;

    return {
      metric: query.metric,
      points,
      change: Math.round(change * 100) / 100,
      changePercentage:
        first != null && first !== 0
          ? Math.round((change / first) * 10000) / 100
          : 0,
    };
  }

  private async getOwned(userId: Id, id: Id): Promise<BodyMeasurementRow> {
    const row = await this.prisma.bodyMeasurement.findUnique({ where: { id } });

    if (!row || row.userId !== userId) {
      throw new NotFoundException('Measurement not found');
    }

    return row;
  }
}
