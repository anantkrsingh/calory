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
  generateDietPlanSchema,
  isoDateSchema,
  logPortionSchema,
  markDietItemsTakenSchema,
  removePortionSchema,
  todayDietSchema,
  type GenerateDietPlanInput,
  type LogPortionInput,
  type MarkDietItemsTakenInput,
  type RemovePortionInput,
} from '@fitness/validation';

import { ClientIp, CurrentUser } from '../common/decorators';
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
    description:
      "Every field is optional. `cuisine` defaults from the caller's " +
      'IP-detected country when omitted. Body shape is shared with the ' +
      'chat agent tool that will call this same flow.',
  })
  @ApiZodBody(generateDietPlanSchema)
  @ApiZodResponse(dietPlanSchema, {
    status: 202,
    description: 'Generation queued',
    name: 'DietPlan',
  })
  @ApiResponse({ status: 503, description: 'Could not queue generation' })
  regenerate(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(generateDietPlanSchema)) body: GenerateDietPlanInput,
    @ClientIp() clientIp: string | undefined,
  ): Promise<DietPlan> {
    return this.dietPlans.regenerate(user.id, body, clientIp);
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
  @Post('today/:date/portions')
  @ApiOperation({
    summary: 'Log an off-plan food by household portion',
    description:
      'For anything eaten that was not on the plan. Send the catalogue id ' +
      'and how many portions — macros are resolved server-side from the ' +
      'catalogue, so the request cannot set its own nutrition values.',
  })
  @ApiZodBody(logPortionSchema)
  @ApiZodResponse(todayDietSchema, {
    description: "Today's diet and progress",
    name: 'TodayDiet',
  })
  logPortion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date', zodPipe(isoDateSchema)) date: string,
    @Body(zodPipe(logPortionSchema)) body: LogPortionInput,
  ): Promise<TodayDiet> {
    return this.dietPlans.logPortion(user.id, date, body);
  }

  @Delete('today/:date/portions')
  @ApiOperation({ summary: 'Remove an off-plan food entry' })
  @ApiZodBody(removePortionSchema)
  @ApiZodResponse(todayDietSchema, {
    description: "Today's diet and progress",
    name: 'TodayDiet',
  })
  removePortion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date', zodPipe(isoDateSchema)) date: string,
    @Body(zodPipe(removePortionSchema)) body: RemovePortionInput,
  ): Promise<TodayDiet> {
    return this.dietPlans.removePortion(user.id, date, body);
  }
}
