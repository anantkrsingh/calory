import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AuthenticatedUser,
  DailySteps,
  StepsSummary,
} from '@fitness/types';
import {
  dailyStepsSchema,
  isoDateSchema,
  stepsRangeQuerySchema,
  stepsSummarySchema,
  upsertStepsSchema,
  type StepsRangeQueryInput,
  type UpsertStepsInput,
} from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { ApiZodBody, ApiZodQuery, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { StepsService } from './steps.service';

@ApiTags('steps')
@ApiBearerAuth('access-token')
@Controller('steps')
export class StepsController {
  constructor(private readonly steps: StepsService) {}

  @Get()
  @ApiOperation({ summary: 'Get daily step counts over a date range' })
  @ApiZodQuery(stepsRangeQuerySchema)
  @ApiZodResponse(dailyStepsSchema, {
    isArray: true,
    description: 'Daily step counts',
    name: 'DailySteps',
  })
  range(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(stepsRangeQuerySchema)) query: StepsRangeQueryInput,
  ): Promise<DailySteps[]> {
    return this.steps.range(user.id, query);
  }

  @Get(':date')
  @ApiOperation({ summary: "Get one day's steps against the daily goal" })
  @ApiZodResponse(stepsSummarySchema, {
    description: 'Steps vs. goal for the day',
    name: 'StepsSummary',
  })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date', zodPipe(isoDateSchema)) date: string,
  ): Promise<StepsSummary> {
    return this.steps.get(user.id, date);
  }

  @Put(':date')
  @ApiOperation({
    summary:
      "Set a day's step count. Idempotent — call it repeatedly as the on-device pedometer climbs through the day.",
  })
  @ApiZodBody(upsertStepsSchema)
  @ApiZodResponse(dailyStepsSchema, {
    description: "The day's steps",
    name: 'DailySteps',
  })
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date', zodPipe(isoDateSchema)) date: string,
    @Body(zodPipe(upsertStepsSchema)) body: UpsertStepsInput,
  ): Promise<DailySteps> {
    return this.steps.upsert(user.id, date, body);
  }
}
