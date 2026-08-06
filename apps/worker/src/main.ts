import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Env } from '@fitness/config/server';
import { OTP_QUEUE_NAME } from '@fitness/types';

import { AppModule } from './app.module';
import { ENV } from './config/env.module';

const logger = new Logger('Worker');

async function bootstrap(): Promise<void> {
  logger.log('Starting BullMQ worker...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const env = app.get<Env>(ENV);

  logger.log(
    `Worker connected to Redis at ${env.REDIS_HOST}:${env.REDIS_PORT}`,
  );
  logger.log(`Worker processing queue: ${OTP_QUEUE_NAME}`);
  logger.log('Worker is ready to process jobs...');

  const shutdown = async (signal: string): Promise<void> => {
    logger.log(`Worker received ${signal}, shutting down gracefully...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.error(`Worker failed to start: ${error}`);
  process.exit(1);
});
