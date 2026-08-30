import { Injectable, NotFoundException } from '@nestjs/common';
import { paginate, toSkipTake, toUser, type Prisma } from '@fitness/db';
import type { Id, Paginated, User } from '@fitness/types';
import type {
  AdminUpdateUserInput,
  ListUsersQueryInput,
  UpdateUserInput,
} from '@fitness/validation';

import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

const AVATAR_FOLDER = 'fitness-tracker/avatars';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  /** Admin-only: every account, newest first, optionally filtered by email/name. */
  async list(query: ListUsersQueryInput): Promise<Paginated<User>> {
    const where: Prisma.UserWhereInput = query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' } },
            {
              profile: {
                is: {
                  displayName: { contains: query.search, mode: 'insensitive' },
                },
              },
            },
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

  /** Uploads the image to Cloudinary and points `profile.avatarUrl` at it. */
  async updateAvatar(id: Id, file: Express.Multer.File): Promise<User> {
    const current = await this.prisma.user.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('User not found');

    const uploaded = await this.uploads.uploadImage(file, AVATAR_FOLDER);

    const user = await this.prisma.user.update({
      where: { id },
      data: { profile: { ...current.profile, avatarUrl: uploaded.url } },
    });

    return toUser(user);
  }

  async adminUpdate(id: Id, input: AdminUpdateUserInput): Promise<User> {
    const current = await this.prisma.user.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('User not found');

    const updateData: Prisma.UserUpdateInput = {};

    if (input.role) updateData.role = input.role;
    if (typeof input.emailVerified === 'boolean')
      updateData.emailVerified = input.emailVerified;
    if (typeof input.totalCredits === 'number')
      updateData.totalCredits = input.totalCredits;
    if (typeof input.remainingCredits === 'number')
      updateData.remainingCredits = input.remainingCredits;
    if (input.planId !== undefined) {
      updateData.plan = input.planId
        ? { connect: { id: input.planId } }
        : { disconnect: true };
    }
    if (input.planName !== undefined)
      updateData.planName = input.planName ?? null;
    if (input.planExpiresAt !== undefined) {
      updateData.planExpiresAt = input.planExpiresAt
        ? new Date(input.planExpiresAt)
        : null;
    }

    if (input.profile) {
      updateData.profile = { ...current.profile, ...input.profile };
    }
    if (input.preferences) {
      updateData.preferences = { ...current.preferences, ...input.preferences };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return toUser(updatedUser);
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
