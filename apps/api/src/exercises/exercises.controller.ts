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
  Exercise,
  ExerciseMuscleGroup,
  ExercisePersonalRecord,
  Paginated,
} from '@fitness/types';
import {
  exerciseSchema,
  exerciseMuscleGroupSchema,
  exercisePersonalRecordSchema,
  createExerciseSchema,
  exerciseByMuscleQuerySchema,
  exerciseQuerySchema,
  objectIdSchema,
  updateExerciseSchema,
  type CreateExerciseInput,
  type ExerciseByMuscleQueryInput,
  type ExerciseQueryInput,
  type UpdateExerciseInput,
} from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { ApiZodBody, ApiZodQuery, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { ExercisesService } from './exercises.service';

@ApiTags('exercises')
@ApiBearerAuth('access-token')
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  @ApiOperation({ summary: 'List exercises — the shared catalogue plus your own custom ones' })
  @ApiZodQuery(exerciseQuerySchema)
  @ApiZodResponse(exerciseSchema, { paginated: true, description: 'Page of exercises', name: 'Exercise' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(exerciseQuerySchema)) query: ExerciseQueryInput,
  ): Promise<Paginated<Exercise>> {
    return this.exercises.list(user.id, query);
  }

  @Get('by-muscle')
  @ApiOperation({
    summary:
      'List exercises grouped by primary muscle — powers the Build screen',
  })
  @ApiZodQuery(exerciseByMuscleQuerySchema)
  @ApiZodResponse(exerciseMuscleGroupSchema, {
    isArray: true,
    description: 'Exercises grouped by muscle',
    name: 'ExerciseMuscleGroup',
  })
  byMuscle(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(exerciseByMuscleQuerySchema))
    query: ExerciseByMuscleQueryInput,
  ): Promise<ExerciseMuscleGroup[]> {
    return this.exercises.byMuscle(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one exercise' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(exerciseSchema, { description: 'The exercise', name: 'Exercise' })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<Exercise> {
    return this.exercises.findById(user.id, id);
  }

  @Get(':id/personal-records')
  @ApiOperation({ summary: 'Get your best set and estimated 1RM for an exercise' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(exercisePersonalRecordSchema, { description: 'Personal records', name: 'ExercisePersonalRecord' })
  personalRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<ExercisePersonalRecord> {
    return this.exercises.personalRecords(user.id, id);
  }

  @Post()
  @ApiOperation({
    summary:
      'Create an exercise — catalogue entry for admins, personal custom for users',
  })
  @ApiZodBody(createExerciseSchema)
  @ApiZodResponse(exerciseSchema, { status: 201, description: 'Created exercise', name: 'Exercise' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(createExerciseSchema)) body: CreateExerciseInput,
  ): Promise<Exercise> {
    return this.exercises.create(user, body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an exercise — catalogue for admins, own custom for users',
  })
  @ApiZodBody(updateExerciseSchema)
  @ApiResponse({ status: 403, description: 'Not yours to modify' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(exerciseSchema, { description: 'Updated exercise', name: 'Exercise' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(updateExerciseSchema)) body: UpdateExerciseInput,
  ): Promise<Exercise> {
    return this.exercises.update(user, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an exercise — catalogue for admins, own custom for users',
  })
  @ApiResponse({ status: 403, description: 'Not yours to modify' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<void> {
    return this.exercises.remove(user, id);
  }
}
