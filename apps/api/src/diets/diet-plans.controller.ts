import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser, DietPlan, TodayDiet } from '@fitness/types';
import {
  dietPlanSchema,
  isoDateSchema,
  markDietItemsTakenSchema,
  todayDietSchema,
  type MarkDietItemsTakenInput,
} from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { ApiZodBody, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { DietPlansService } from './diet-plans.service';

@ApiTags('diet-plans')
@ApiBearerAuth('access-token')
@Controller('diet-plans')
export class DietPlansController {
  constructor(private readonly dietPlans: DietPlansService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get your AI-generated weekly diet plan',
    description:
      'Status is `generating` while the worker builds it, then `active`.',
  })
  @ApiZodResponse(dietPlanSchema, {
    description: 'Your current diet plan',
    name: 'DietPlan',
  })
  @ApiResponse({
    status: 404,
    description: 'No diet plan has been requested yet',
  })
  me(@CurrentUser() user: AuthenticatedUser): Promise<DietPlan> {
    return this.dietPlans.findCurrent(user.id);
  }

  @Get('today/:date')
  @ApiOperation({
    summary: "Get one day's slice of the active plan plus what's been taken",
  })
  @ApiZodResponse(todayDietSchema, {
    description: "Today's diet and progress",
    name: 'TodayDiet',
  })
  today(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date', zodPipe(isoDateSchema)) date: string,
  ): Promise<TodayDiet> {
    return this.dietPlans.getToday(user.id, date);
  }

  @Post('regenerate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      'Queue a fresh diet plan — first-time creation and regeneration both ' +
      'go through this (there is no auto-generated plan to start from).',
  })
  @ApiZodResponse(dietPlanSchema, {
    status: 202,
    description: 'Generation queued',
    name: 'DietPlan',
  })
  @ApiResponse({ status: 503, description: 'Could not queue generation' })
  regenerate(@CurrentUser() user: AuthenticatedUser): Promise<DietPlan> {
    return this.dietPlans.regenerate(user.id);
  }

  @Patch('today/:date')
  @ApiOperation({
    summary: 'Mark a meal item — or a whole meal — taken/untaken for a date',
    description: 'Omit `itemId` to toggle every item in the meal at once.',
  })
  @ApiZodBody(markDietItemsTakenSchema)
  @ApiZodResponse(todayDietSchema, {
    description: "Today's diet and progress",
    name: 'TodayDiet',
  })
  markTaken(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date', zodPipe(isoDateSchema)) date: string,
    @Body(zodPipe(markDietItemsTakenSchema)) body: MarkDietItemsTakenInput,
  ): Promise<TodayDiet> {
    return this.dietPlans.markTaken(user.id, date, body);
  }
}
