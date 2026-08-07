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
  Routine,
  RoutineSummary,
  Workout,
} from '@fitness/types';
import {
  routineSchema,
  routineSummarySchema,
  workoutSchema,
  createRoutineSchema,
  objectIdSchema,
  routineQuerySchema,
  startRoutineSchema,
  updateRoutineSchema,
  type CreateRoutineInput,
  type RoutineQueryInput,
  type StartRoutineInput,
  type UpdateRoutineInput,
} from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { ApiZodBody, ApiZodQuery, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { RoutinesService } from './routines.service';

@ApiTags('routines')
@ApiBearerAuth('access-token')
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routines: RoutinesService) {}

  @Get()
  @ApiOperation({ summary: 'List your routines' })
  @ApiZodQuery(routineQuerySchema)
  @ApiZodResponse(routineSummarySchema, { paginated: true, description: 'Page of routines', name: 'RoutineSummary' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(routineQuerySchema)) query: RoutineQueryInput,
  ): Promise<Paginated<RoutineSummary>> {
    return this.routines.list(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one routine with its planned exercises' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(routineSchema, { description: 'The routine', name: 'Routine' })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<Routine> {
    return this.routines.findById(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a routine' })
  @ApiZodBody(createRoutineSchema)
  @ApiZodResponse(routineSchema, { status: 201, description: 'Created routine', name: 'Routine' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(createRoutineSchema)) body: CreateRoutineInput,
  ): Promise<Routine> {
    return this.routines.create(user.id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a routine' })
  @ApiZodBody(updateRoutineSchema)
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(routineSchema, { description: 'Updated routine', name: 'Routine' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(updateRoutineSchema)) body: UpdateRoutineInput,
  ): Promise<Routine> {
    return this.routines.update(user.id, id, body);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a workout pre-filled from this routine' })
  @ApiZodBody(startRoutineSchema)
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Conflicts with current state' })
  @ApiZodResponse(workoutSchema, { status: 201, description: 'Workout started from the routine', name: 'Workout' })
  start(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(startRoutineSchema)) body: StartRoutineInput,
  ): Promise<Workout> {
    return this.routines.start(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a routine' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<void> {
    return this.routines.remove(user.id, id);
  }
}
