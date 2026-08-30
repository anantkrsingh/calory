import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { toPlan } from '@fitness/db';
import type { Id, Plan } from '@fitness/types';
import type { CreatePlanInput, UpdatePlanInput } from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async list(activeOnly = false): Promise<Plan[]> {
    const rows = await this.prisma.plan.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toPlan);
  }

  async findById(id: Id): Promise<Plan> {
    const row = await this.prisma.plan.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Plan not found');
    return toPlan(row);
  }

  async create(input: CreatePlanInput): Promise<Plan> {
    const existing = await this.prisma.plan.findUnique({
      where: { name: input.name },
    });
    if (existing) {
      throw new ConflictException('A plan with this name already exists');
    }

    const row = await this.prisma.plan.create({
      data: {
        name: input.name,
        description: input.description,
        duration: input.duration,
        durationDays: input.durationDays,
        price: input.price,
        currency: input.currency ?? 'USD',
        benefits: input.benefits ?? [],
        storeProductId: input.storeProductId,
        isActive: input.isActive ?? true,
      },
    });

    return toPlan(row);
  }

  async update(id: Id, input: UpdatePlanInput): Promise<Plan> {
    const current = await this.prisma.plan.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Plan not found');

    if (input.name && input.name !== current.name) {
      const existing = await this.prisma.plan.findUnique({
        where: { name: input.name },
      });
      if (existing) {
        throw new ConflictException('A plan with this name already exists');
      }
    }

    const row = await this.prisma.plan.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.duration ? { duration: input.duration } : {}),
        ...(input.durationDays !== undefined
          ? { durationDays: input.durationDays }
          : {}),
        ...(typeof input.price === 'number' ? { price: input.price } : {}),
        ...(input.currency ? { currency: input.currency } : {}),
        ...(input.benefits ? { benefits: input.benefits } : {}),
        ...(input.storeProductId !== undefined
          ? { storeProductId: input.storeProductId }
          : {}),
        ...(typeof input.isActive === 'boolean'
          ? { isActive: input.isActive }
          : {}),
      },
    });

    return toPlan(row);
  }

  async remove(id: Id): Promise<void> {
    const current = await this.prisma.plan.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Plan not found');

    // Unlink users using this plan before deletion
    await this.prisma.user.updateMany({
      where: { planId: id },
      data: { planId: null, planName: null },
    });

    await this.prisma.plan.delete({ where: { id } });
  }
}
