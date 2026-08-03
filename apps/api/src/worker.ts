import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Env } from '@fitness/config/server';

import { WorkerAppModule } from './worker.module';
import { ENV } from './config/env.module';
import { OTP_QUEUE_NAME } from './queues/otp.queue';

const logger = new Logger('Worker');

/**
 * Worker entry point for BullMQ background jobs
 * 
 * Run with: pnpm run start:worker
 * 
 * This worker process will connect to Redis and process jobs from the queues.
 * It's designed to run separately from the main API server.
 */
async function bootstrapWorker(): Promise<void> {
  logger.log('Starting BullMQ worker...');

  // Create a minimal NestJS application just for the worker
  const app = await NestFactory.createApplicationContext(WorkerAppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const env = app.get<Env>(ENV);

  logger.log(
    `Worker connected to Redis at ${env.REDIS_HOST}:${env.REDIS_PORT}`,
  );
  logger.log(`Worker processing queue: ${OTP_QUEUE_NAME}`);
  logger.log('Worker is ready to process jobs...');
  
  // The OtpQueueProcessor will be automatically registered through the module system
  // BullMQ will pick up the @Processor decorators and start processing jobs

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('Worker received SIGTERM, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('Worker received SIGINT, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });
}

bootstrapWorker().catch((error) => {
  logger.error(`Worker failed to start: ${error}`);
  process.exit(1);
});
