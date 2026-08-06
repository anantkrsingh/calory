import { Module } from '@nestjs/common';

import { EnvModule } from './config/env.module';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [EnvModule, QueuesModule],
})
export class AppModule {}
