import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { EnvModule } from './config/env.module';
import { ExercisesModule } from './exercises/exercises.module';
import { GoalsModule } from './goals/goals.module';
import { HealthModule } from './health/health.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueuesModule } from './queues/queues.module';
import { RoutinesModule } from './routines/routines.module';
import { SettingsModule } from './settings/settings.module';
import { StatsModule } from './stats/stats.module';
import { UsersModule } from './users/users.module';
import { WorkoutsModule } from './workouts/workouts.module';

@Module({
  imports: [
    EnvModule,
    PrismaModule,
    QueuesModule,
    AiModule,
    AuthModule,
    UsersModule,
    ExercisesModule,
    WorkoutsModule,
    RoutinesModule,
    MeasurementsModule,
    GoalsModule,
    StatsModule,
    SettingsModule,
    HealthModule,
  ],
  providers: [
    // Authenticated by default; routes opt out with `@Public()`.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Opt-in on top of the above; routes opt in with `@Roles('admin')`.
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
