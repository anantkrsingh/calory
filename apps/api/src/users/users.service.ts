import { Injectable, NotFoundException } from '@nestjs/common';
import { toUser } from '@fitness/db';
import type { Id, User } from '@fitness/types';
import type { UpdateUserInput } from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
