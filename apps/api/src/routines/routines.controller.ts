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
  Routine,
  RoutineSummary,
  Workout,
} from '@fitness/types';
import {
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
import { zodPipe } from '../common/zod-validation.pipe';
import { RoutinesService } from './routines.service';

@Controller('routines')
export class RoutinesController {
  constructor(private readonly routines: RoutinesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(routineQuerySchema)) query: RoutineQueryInput,
  ): Promise<Paginated<RoutineSummary>> {
    return this.routines.list(user.id, query);
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<Routine> {
    return this.routines.findById(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(createRoutineSchema)) body: CreateRoutineInput,
  ): Promise<Routine> {
    return this.routines.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(updateRoutineSchema)) body: UpdateRoutineInput,
  ): Promise<Routine> {
    return this.routines.update(user.id, id, body);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.CREATED)
  start(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(startRoutineSchema)) body: StartRoutineInput,
  ): Promise<Workout> {
    return this.routines.start(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<void> {
    return this.routines.remove(user.id, id);
  }
}
