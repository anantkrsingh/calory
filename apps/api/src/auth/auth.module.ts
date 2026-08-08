import { Global, Module } from '@nestjs/common';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import type { Env } from '@fitness/config/server';

import { ENV } from '../config/env.module';
import { MeasurementsModule } from '../measurements/measurements.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

@Global()
@Module({
  imports: [
    MeasurementsModule,
    JwtModule.registerAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        secret: env.JWT_SECRET,
        // jsonwebtoken types `expiresIn` as a literal union of duration strings;
        // the env schema already validates that format.
        signOptions: {
          expiresIn: env.JWT_EXPIRES_IN as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
