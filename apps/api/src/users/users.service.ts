import { Injectable, NotFoundException } from '@nestjs/common';
import { paginate, toSkipTake, toUser, type Prisma } from '@fitness/db';
import type { Id, Paginated, User } from '@fitness/types';
import type { ListUsersQueryInput, UpdateUserInput } from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Admin-only: every account, newest first, optionally filtered by email/name. */
  async list(query: ListUsersQueryInput): Promise<Paginated<User>> {
    const where: Prisma.UserWhereInput = query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' } },
            { profile: { displayName: { contains: query.search, mode: 'insensitive' } } },
          ],
        }
      : {};

    const { skip, take } = toSkipTake(query);

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(rows.map(toUser), query, total);
  }

  async findById(id: Id): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return toUser(user);
  }

  async update(id: Id, input: UpdateUserInput): Promise<User> {
    const current = await this.prisma.user.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('User not found');

    // Composite updates replace the whole object, so merge onto what is stored
    // rather than letting a partial patch blank out untouched fields.
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(input.profile
          ? { profile: { ...current.profile, ...input.profile } }
          : {}),
        ...(input.preferences
          ? { preferences: { ...current.preferences, ...input.preferences } }
          : {}),
      },
    });

    return toUser(user);
  }

  /** Removes the account and everything hanging off it. */
  async remove(id: Id): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.workout.deleteMany({ where: { userId: id } }),
      this.prisma.routine.deleteMany({ where: { userId: id } }),
      this.prisma.bodyMeasurement.deleteMany({ where: { userId: id } }),
      this.prisma.goal.deleteMany({ where: { userId: id } }),
      this.prisma.exercise.deleteMany({ where: { createdById: id } }),
      this.prisma.user.delete({ where: { id } }),
    ]);
  }
}
