import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser, WorkoutRoutine } from '@fitness/types';
import { workoutRoutineSchema } from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { ApiZodResponse } from '../common/swagger';
import { WorkoutRoutineService } from './workout-routine.service';

@ApiTags('workout-routines')
@ApiBearerAuth('access-token')
@Controller('workout-routines')
export class WorkoutRoutineController {
  constructor(private readonly routines: WorkoutRoutineService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get your AI-generated weekly routine',
    description:
      'Status is `generating` while the worker builds it, then `active`.',
  })
  @ApiZodResponse(workoutRoutineSchema, {
    description: 'Your current routine',
    name: 'WorkoutRoutine',
  })
  @ApiResponse({ status: 404, description: 'No routine has been requested yet' })
  me(@CurrentUser() user: AuthenticatedUser): Promise<WorkoutRoutine> {
    return this.routines.findCurrent(user.id);
  }

  @Post('regenerate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Queue a fresh routine, superseding the current one',
  })
  @ApiZodResponse(workoutRoutineSchema, {
    status: 202,
    description: 'Generation queued',
    name: 'WorkoutRoutine',
  })
  @ApiResponse({ status: 503, description: 'Could not queue generation' })
  regenerate(@CurrentUser() user: AuthenticatedUser): Promise<WorkoutRoutine> {
    return this.routines.regenerate(user.id);
  }
}
