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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {
  AuthenticatedUser,
  Goal,
  GoalProgress,
  Paginated,
} from '@fitness/types';
import {
  goalSchema,
  goalProgressSchema,
  createGoalSchema,
  goalQuerySchema,
  objectIdSchema,
  updateGoalSchema,
  type CreateGoalInput,
  type GoalQueryInput,
  type UpdateGoalInput,
} from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { ApiZodBody, ApiZodQuery, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { GoalsService } from './goals.service';

@ApiTags('goals')
@ApiBearerAuth('access-token')
@Controller('goals')
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'List your goals' })
  @ApiZodQuery(goalQuerySchema)
  @ApiZodResponse(goalSchema, { paginated: true, description: 'Page of goals', name: 'Goal' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(goalQuerySchema)) query: GoalQueryInput,
  ): Promise<Paginated<Goal>> {
    return this.goals.list(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one goal' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(goalSchema, { description: 'The goal', name: 'Goal' })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<Goal> {
    return this.goals.findById(user.id, id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get current progress towards a goal' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(goalProgressSchema, { description: 'Progress towards the goal', name: 'GoalProgress' })
  progress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<GoalProgress> {
    return this.goals.progress(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a goal' })
  @ApiZodBody(createGoalSchema)
  @ApiZodResponse(goalSchema, { status: 201, description: 'Created goal', name: 'Goal' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(createGoalSchema)) body: CreateGoalInput,
  ): Promise<Goal> {
    return this.goals.create(user.id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a goal' })
  @ApiZodBody(updateGoalSchema)
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(goalSchema, { description: 'Updated goal', name: 'Goal' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(updateGoalSchema)) body: UpdateGoalInput,
  ): Promise<Goal> {
    return this.goals.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a goal' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<void> {
    return this.goals.remove(user.id, id);
  }
}
