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
  Paginated,
  Workout,
  WorkoutSummary,
} from '@fitness/types';
import {
  workoutSchema,
  workoutSummarySchema,
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
import { ApiZodBody, ApiZodQuery, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { WorkoutsService } from './workouts.service';

@ApiTags('workouts')
@ApiBearerAuth('access-token')
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workouts: WorkoutsService) {}

  @Get()
  @ApiOperation({
    summary: 'List completed and cancelled workouts, newest first',
  })
  @ApiZodQuery(workoutQuerySchema)
  @ApiZodResponse(workoutSummarySchema, {
    paginated: true,
    description: 'Page of workouts',
    name: 'WorkoutSummary',
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(workoutQuerySchema)) query: WorkoutQueryInput,
  ): Promise<Paginated<WorkoutSummary>> {
    return this.workouts.list(user.id, query);
  }

  // Declared before `:id` so "active" is not parsed as an id.
  @Get('active')
  @ApiOperation({ summary: 'Get the workout currently in progress, or null' })
  @ApiZodResponse(workoutSchema, {
    description: 'The in-progress workout, or null',
    name: 'Workout',
  })
  active(@CurrentUser() user: AuthenticatedUser): Promise<Workout | null> {
    return this.workouts.findActive(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one workout with all logged sets' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(workoutSchema, {
    description: 'The workout',
    name: 'Workout',
  })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<Workout> {
    return this.workouts.findById(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Start a workout' })
  @ApiZodBody(createWorkoutSchema)
  @ApiResponse({ status: 409, description: 'Conflicts with current state' })
  @ApiZodResponse(workoutSchema, {
    status: 201,
    description: 'Started workout',
    name: 'Workout',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(createWorkoutSchema)) body: CreateWorkoutInput,
  ): Promise<Workout> {
    return this.workouts.create(user.id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a workout in progress' })
  @ApiZodBody(updateWorkoutSchema)
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(workoutSchema, {
    description: 'Updated workout',
    name: 'Workout',
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(updateWorkoutSchema)) body: UpdateWorkoutInput,
  ): Promise<Workout> {
    return this.workouts.update(user.id, id, body);
  }

  @Post(':id/sets')
  @ApiOperation({ summary: 'Log a set against an exercise in this workout' })
  @ApiZodBody(logSetSchema)
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(workoutSchema, {
    status: 201,
    description: 'Workout with the logged set',
    name: 'Workout',
  })
  logSet(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(logSetSchema)) body: LogSetInput,
  ): Promise<Workout> {
    return this.workouts.logSet(user.id, id, body);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finish the workout and compute its stats' })
  @ApiZodBody(completeWorkoutSchema)
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Conflicts with current state' })
  @ApiZodResponse(workoutSchema, {
    description: 'Completed workout with computed stats',
    name: 'Workout',
  })
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(completeWorkoutSchema)) body: CompleteWorkoutInput,
  ): Promise<Workout> {
    return this.workouts.complete(user.id, id, body);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Abandon the workout without recording it' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Conflicts with current state' })
  @ApiZodResponse(workoutSchema, {
    description: 'Cancelled workout',
    name: 'Workout',
  })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<Workout> {
    return this.workouts.cancel(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a workout' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<void> {
    return this.workouts.remove(user.id, id);
  }
}
