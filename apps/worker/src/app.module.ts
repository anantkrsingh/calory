import { Module } from '@nestjs/common';

import { AiModule } from './ai/ai.module';
import { EnvModule } from './config/env.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [EnvModule, PrismaModule, AiModule, QueuesModule],
})
export class AppModule {}
