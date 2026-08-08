import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  healthResponseSchema,
} from '@fitness/validation';

import { Public } from '../common/decorators';
import { ApiZodResponse } from '../common/swagger';
import { PrismaService } from '../prisma/prisma.service';

interface HealthResponse {
  status: 'ok' | 'degraded';
  uptimeSec: number;
  database: 'up' | 'down';
  timestamp: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness probe — reports API uptime and database reachability' })
  @ApiZodResponse(healthResponseSchema, { description: 'Service health', name: 'HealthStatus' })
  async check(): Promise<HealthResponse> {
    const database = await this.pingDatabase();

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      uptimeSec: Math.round(process.uptime()),
      database,
      timestamp: new Date().toISOString(),
    };
  }

  private async pingDatabase(): Promise<'up' | 'down'> {
    try {
      await this.prisma.$runCommandRaw({ ping: 1 });
      return 'up';
    } catch {
      return 'down';
    }
  }
}
