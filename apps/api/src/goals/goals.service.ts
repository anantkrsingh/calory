import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  paginate,
  toGoal,
  toSkipTake,
  type GoalRow,
} from '@fitness/db';
import type { Goal, GoalProgress, Id, Paginated } from '@fitness/types';
import type {
  CreateGoalInput,
  GoalQueryInput,
  UpdateGoalInput,
} from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: Id, query: GoalQueryInput): Promise<Paginated<Goal>> {
    const where: Prisma.GoalWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const { skip, take } = toSkipTake(query);

    const [rows, total] = await Promise.all([
      this.prisma.goal.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.goal.count({ where }),
    ]);

    return paginate(rows.map(toGoal), query, total);
  }

  async findById(userId: Id, id: Id): Promise<Goal> {
    return toGoal(await this.getOwned(userId, id));
  }

  async create(userId: Id, input: CreateGoalInput): Promise<Goal> {
    const goal = await this.prisma.goal.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        targetValue: input.targetValue,
        startValue: input.startValue,
        // Progress starts where the user is today.
        currentValue: input.startValue,
        unit: input.unit,
        ...(input.deadline ? { deadline: input.deadline } : {}),
        ...(input.exerciseId ? { exerciseId: input.exerciseId } : {}),
      },
    });

    return toGoal(goal);
  }

  async update(userId: Id, id: Id, input: UpdateGoalInput): Promise<Goal> {
    const current = await this.getOwned(userId, id);

    const currentValue = input.currentValue ?? current.currentValue;
    const targetValue = input.targetValue ?? current.targetValue;
    const reached = hasReachedTarget(
      current.startValue,
      targetValue,
      currentValue,
    );

    const goal = await this.prisma.goal.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.targetValue != null
          ? { targetValue: input.targetValue }
          : {}),
        ...(input.currentValue != null
          ? { currentValue: input.currentValue }
          : {}),
        ...(input.unit ? { unit: input.unit } : {}),
        ...(input.deadline ? { deadline: input.deadline } : {}),
        // An explicit status wins; otherwise crossing the target auto-achieves.
        ...(input.status
          ? { status: input.status }
          : reached && current.status === 'active'
            ? { status: 'achieved', achievedAt: new Date() }
            : {}),
      },
    });

    return toGoal(goal);
  }

  async remove(userId: Id, id: Id): Promise<void> {
    await this.getOwned(userId, id);
    await this.prisma.goal.delete({ where: { id } });
  }

  async progress(userId: Id, id: Id): Promise<GoalProgress> {
    const goal = await this.getOwned(userId, id);

    const span = goal.targetValue - goal.startValue;
    const travelled = goal.currentValue - goal.startValue;

    // Works for both directions: losing weight has a negative span, and the
    // ratio of two negatives is still forward progress.
    const ratio = span === 0 ? 1 : travelled / span;
    const percentage = Math.min(100, Math.max(0, Math.round(ratio * 100)));

    return {
      goalId: goal.id,
      percentage,
      remaining: Math.round((goal.targetValue - goal.currentValue) * 100) / 100,
      isOnTrack: this.isOnTrack(goal, percentage),
    };
  }

  /**
   * Compares elapsed time against progress made. With no deadline there is
   * nothing to fall behind, so anything short of complete counts as on track.
   */
  private isOnTrack(goal: GoalRow, percentage: number): boolean {
    if (!goal.deadline) return true;

    const start = goal.createdAt.getTime();
    const end = new Date(goal.deadline).getTime();
    const now = Date.now();

    if (now >= end) return percentage >= 100;
    if (end <= start) return true;

    const elapsedPercentage = ((now - start) / (end - start)) * 100;
    return percentage >= elapsedPercentage;
  }

  private async getOwned(userId: Id, id: Id): Promise<GoalRow> {
    const goal = await this.prisma.goal.findUnique({ where: { id } });

    if (!goal || goal.userId !== userId) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }
}

function hasReachedTarget(
  startValue: number,
  targetValue: number,
  currentValue: number,
): boolean {
  return targetValue >= startValue
    ? currentValue >= targetValue
    : currentValue <= targetValue;
}
