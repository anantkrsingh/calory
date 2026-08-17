import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { toWorkoutRoutine } from '@fitness/db';
import type { Id, WorkoutRoutine } from '@fitness/types';

import { PrismaService } from '../prisma/prisma.service';
import { RoutineQueue } from '../queues/routine.queue';

@Injectable()
export class WorkoutRoutineService {
  private readonly logger = new Logger(WorkoutRoutineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: RoutineQueue,
  ) {}

  /** Never throws: a failure here must not stop registration from completing. */
  async requestGeneration(userId: Id): Promise<WorkoutRoutine | null> {
    try {
      const routine = await this.prisma.workoutRoutine.create({
        data: { userId, status: 'generating', days: [] },
      });

      const job = await this.queue.generate({ userId, routineId: routine.id });

      if (!job) {
        // Nothing will process it, so retire the placeholder and keep whatever
        // routine the user already had.
        await this.prisma.workoutRoutine.update({
          where: { id: routine.id },
          data: { status: 'failed', error: 'Could not queue generation job' },
        });
        return null;
      }

      // Only retire the previous routine once the new job is safely queued.
      await this.prisma.workoutRoutine.updateMany({
        where: {
          userId,
          id: { not: routine.id },
          status: { in: ['generating', 'active'] },
        },
        data: { status: 'superseded' },
      });

      return toWorkoutRoutine(routine);
    } catch (error) {
      this.logger.error(
        `Could not request routine generation for ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  /** The newest routine that is still generating, active or failed. */
  async findCurrent(userId: Id): Promise<WorkoutRoutine> {
    const routine = await this.prisma.workoutRoutine.findFirst({
      where: { userId, status: { in: ['generating', 'active', 'failed'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (!routine) throw new NotFoundException('No workout routine yet');

    return toWorkoutRoutine(routine);
  }

  async regenerate(userId: Id): Promise<WorkoutRoutine> {
    const routine = await this.requestGeneration(userId);
    if (!routine) {
      throw new ServiceUnavailableException(
        'Could not start routine generation, please try again',
      );
    }
    return routine;
  }
}
