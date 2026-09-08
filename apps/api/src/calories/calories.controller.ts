import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser, CalorieBalance } from '@fitness/types';
import {
  calorieBalanceSchema,
  calorieRangeQuerySchema,
  isoDateSchema,
  type CalorieRangeQueryInput,
} from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { ApiZodQuery, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { CaloriesService } from './calories.service';

@ApiTags('calories')
@ApiBearerAuth('access-token')
@Controller('calories')
export class CaloriesController {
  constructor(private readonly calories: CaloriesService) {}

  @Get('today/:date')
  @ApiOperation({
    summary: "Get one day's calorie balance",
    description:
      'BMR/TDEE from the Mifflin-St Jeor formula, intake from the diet items ' +
      'marked taken, burn MET-scored from completed sets plus steps. ' +
      'BMR-derived fields read `null` until the profile carries height, ' +
      'weight, date of birth and sex. MET values and every other constant ' +
      'are admin-configurable from the settings screen.',
  })
  @ApiZodResponse(calorieBalanceSchema, {
    description: "The day's energy balance",
    name: 'CalorieBalance',
  })
  today(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date', zodPipe(isoDateSchema)) date: string,
  ): Promise<CalorieBalance> {
    return this.calories.getBalance(user.id, date);
  }

  @Get('range')
  @ApiOperation({
    summary: 'Get the calorie balance for each day over a date range',
  })
  @ApiZodQuery(calorieRangeQuerySchema)
  @ApiZodResponse(calorieBalanceSchema, {
    isArray: true,
    description: 'Energy balance per day',
    name: 'CalorieBalance',
  })
  range(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(calorieRangeQuerySchema)) query: CalorieRangeQueryInput,
  ): Promise<CalorieBalance[]> {
    return this.calories.getRange(user.id, query.from, query.to);
  }
}
