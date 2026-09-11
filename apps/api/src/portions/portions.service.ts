import { Injectable, NotFoundException } from '@nestjs/common';
import { toPortionFood } from '@fitness/db';
import type { Id, PortionFood } from '@fitness/types';
import type {
  CreatePortionFoodInput,
  UpdatePortionFoodInput,
} from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The picker's catalogue. Inactive entries are hidden from users but kept
   * so historical log entries still reference something real. */
  async list(includeInactive = false): Promise<PortionFood[]> {
    const rows = await this.prisma.portionFood.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toPortionFood);
  }

  async findById(id: Id): Promise<PortionFood> {
    const row = await this.prisma.portionFood.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Portion food not found');
    return toPortionFood(row);
  }

  async create(input: CreatePortionFoodInput): Promise<PortionFood> {
    const row = await this.prisma.portionFood.create({
      data: {
        ...input,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
      },
    });
    return toPortionFood(row);
  }

  async update(id: Id, input: UpdatePortionFoodInput): Promise<PortionFood> {
    await this.findById(id);
    const row = await this.prisma.portionFood.update({
      where: { id },
      data: input,
    });
    return toPortionFood(row);
  }

  async remove(id: Id): Promise<void> {
    await this.findById(id);
    await this.prisma.portionFood.delete({ where: { id } });
  }
}
