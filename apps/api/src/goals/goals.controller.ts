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
  Goal,
  GoalProgress,
  Paginated,
} from '@fitness/types';
import {
  createGoalSchema,
  goalQuerySchema,
  objectIdSchema,
  updateGoalSchema,
  type CreateGoalInput,
  type GoalQueryInput,
  type UpdateGoalInput,
} from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { zodPipe } from '../common/zod-validation.pipe';
import { GoalsService } from './goals.service';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(goalQuerySchema)) query: GoalQueryInput,
  ): Promise<Paginated<Goal>> {
    return this.goals.list(user.id, query);
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<Goal> {
    return this.goals.findById(user.id, id);
  }

  @Get(':id/progress')
  progress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<GoalProgress> {
    return this.goals.progress(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(createGoalSchema)) body: CreateGoalInput,
  ): Promise<Goal> {
    return this.goals.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(updateGoalSchema)) body: UpdateGoalInput,
  ): Promise<Goal> {
    return this.goals.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<void> {
    return this.goals.remove(user.id, id);
  }
}
