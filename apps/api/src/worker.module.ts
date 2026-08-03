import { Module } from '@nestjs/common';

import { EnvModule } from './config/env.module';
import { WorkerModule as QueuesWorkerModule } from './queues/worker.module';

/**
 * Worker Application Module
 * 
 * This is the root module for the worker process.
 * It imports only the necessary modules for background job processing.
 */
@Module({
  imports: [
    EnvModule,
    QueuesWorkerModule,
  ],
})
export class WorkerAppModule {}
