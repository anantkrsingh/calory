import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type {
  AuthenticatedUser,
  Paginated,
  Workout,
  WorkoutSummary,
} from '@fitness/types';
import {
  completeWorkoutSchema,
  createWorkoutSchema,
  logSetSchema,
  objectIdSchema,
  updateWorkoutSchema,
  workoutQuerySchema,
  type CompleteWorkoutInput,
  type CreateWorkoutInput,
  type LogSetInput,
  type UpdateWorkoutInput,
  type WorkoutQueryInput,
} from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { zodPipe } from '../common/zod-validation.pipe';
import { WorkoutsService } from './workouts.service';

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workouts: WorkoutsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(workoutQuerySchema)) query: WorkoutQueryInput,
  ): Promise<Paginated<WorkoutSummary>> {
    return this.workouts.list(user.id, query);
  }

  // Declared before `:id` so "active" is not parsed as an id.
  @Get('active')
  active(@CurrentUser() user: AuthenticatedUser): Promise<Workout | null> {
    return this.workouts.findActive(user.id);
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<Workout> {
    return this.workouts.findById(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(createWorkoutSchema)) body: CreateWorkoutInput,
  ): Promise<Workout> {
    return this.workouts.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(updateWorkoutSchema)) body: UpdateWorkoutInput,
  ): Promise<Workout> {
    return this.workouts.update(user.id, id, body);
  }

  @Post(':id/sets')
  logSet(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(logSetSchema)) body: LogSetInput,
  ): Promise<Workout> {
    return this.workouts.logSet(user.id, id, body);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(completeWorkoutSchema)) body: CompleteWorkoutInput,
  ): Promise<Workout> {
    return this.workouts.complete(user.id, id, body);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<Workout> {
    return this.workouts.cancel(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<void> {
    return this.workouts.remove(user.id, id);
  }
}
