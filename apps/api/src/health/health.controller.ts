import { Controller, Get } from '@nestjs/common';

import { Public } from '../common/decorators';
import { PrismaService } from '../prisma/prisma.service';

interface HealthResponse {
  status: 'ok' | 'degraded';
  uptimeSec: number;
  database: 'up' | 'down';
  timestamp: string;
}

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
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
