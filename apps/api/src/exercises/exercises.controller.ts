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
  Exercise,
  ExercisePersonalRecord,
  Paginated,
} from '@fitness/types';
import {
  createExerciseSchema,
  exerciseQuerySchema,
  objectIdSchema,
  updateExerciseSchema,
  type CreateExerciseInput,
  type ExerciseQueryInput,
  type UpdateExerciseInput,
} from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { zodPipe } from '../common/zod-validation.pipe';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(exerciseQuerySchema)) query: ExerciseQueryInput,
  ): Promise<Paginated<Exercise>> {
    return this.exercises.list(user.id, query);
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<Exercise> {
    return this.exercises.findById(user.id, id);
  }

  @Get(':id/personal-records')
  personalRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<ExercisePersonalRecord> {
    return this.exercises.personalRecords(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(createExerciseSchema)) body: CreateExerciseInput,
  ): Promise<Exercise> {
    return this.exercises.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(updateExerciseSchema)) body: UpdateExerciseInput,
  ): Promise<Exercise> {
    return this.exercises.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<void> {
    return this.exercises.remove(user.id, id);
  }
}
