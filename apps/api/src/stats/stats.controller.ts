import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AuthenticatedUser,
  DailyActivity,
  DashboardStats,
  VolumeByMuscleGroup,
} from '@fitness/types';
import {
  dashboardStatsSchema,
  volumeByMuscleGroupSchema,
  dailyActivitySchema,
  dashboardQuerySchema,
  statsRangeSchema,
  type DashboardQueryInput,
  type StatsRangeInput,
} from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { ApiZodQuery, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { StatsService } from './stats.service';

@ApiTags('stats')
@ApiBearerAuth('access-token')
@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get the home dashboard summary' })
  @ApiZodQuery(dashboardQuerySchema)
  @ApiZodResponse(dashboardStatsSchema, {
    description: 'Dashboard summary',
    name: 'DashboardStats',
  })
  dashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(dashboardQuerySchema)) query: DashboardQueryInput,
  ): Promise<DashboardStats> {
    return this.stats.dashboard(user.id, query);
  }

  @Get('volume')
  @ApiOperation({ summary: 'Get training volume grouped by muscle group' })
  @ApiZodQuery(statsRangeSchema)
  @ApiZodResponse(volumeByMuscleGroupSchema, {
    isArray: true,
    description: 'Volume per muscle group',
    name: 'VolumeByMuscleGroup',
  })
  volume(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(statsRangeSchema)) query: StatsRangeInput,
  ): Promise<VolumeByMuscleGroup[]> {
    return this.stats.volumeByMuscleGroup(user.id, query);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get daily activity over a date range' })
  @ApiZodQuery(statsRangeSchema)
  @ApiZodResponse(dailyActivitySchema, {
    isArray: true,
    description: 'Daily activity series',
    name: 'DailyActivity',
  })
  activity(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(statsRangeSchema)) query: StatsRangeInput,
  ): Promise<DailyActivity[]> {
    return this.stats.activity(user.id, query);
  }
}
