import { Controller, Get, Query } from '@nestjs/common';
import type {
  AuthenticatedUser,
  DailyActivity,
  DashboardStats,
  VolumeByMuscleGroup,
} from '@fitness/types';
import {
  dashboardQuerySchema,
  statsRangeSchema,
  type DashboardQueryInput,
  type StatsRangeInput,
} from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { zodPipe } from '../common/zod-validation.pipe';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('dashboard')
  dashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(dashboardQuerySchema)) query: DashboardQueryInput,
  ): Promise<DashboardStats> {
    return this.stats.dashboard(user.id, query);
  }

  @Get('volume')
  volume(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(statsRangeSchema)) query: StatsRangeInput,
  ): Promise<VolumeByMuscleGroup[]> {
    return this.stats.volumeByMuscleGroup(user.id, query);
  }

  @Get('activity')
  activity(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(statsRangeSchema)) query: StatsRangeInput,
  ): Promise<DailyActivity[]> {
    return this.stats.activity(user.id, query);
  }
}
