import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser, TodayRoutine, WorkoutRoutine } from '@fitness/types';
import { isoDateSchema, todayRoutineSchema, workoutRoutineSchema } from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
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

  @Get('today/:date')
  @ApiOperation({
    summary: "Get one day's slice of the active routine plus live progress",
    description:
      "Combines today's planned steps/calorie targets with the user's real " +
      'step count and logged sets, for the home screen.',
  })
  @ApiZodResponse(todayRoutineSchema, {
    description: "Today's routine and progress",
    name: 'TodayRoutine',
  })
  today(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date', zodPipe(isoDateSchema)) date: string,
  ): Promise<TodayRoutine> {
    return this.routines.getToday(user.id, date);
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
