import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { API_VERSION } from '@fitness/config';
import type { Env } from '@fitness/config/server';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { ENV } from './config/env.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const env = app.get<Env>(ENV);

  app.use(helmet());
  app.enableCors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true,
  });

  // Mounts everything under e.g. /api/v1 — the mobile app's EXPO_PUBLIC_API_URL
  // points at this same prefix.
  app.setGlobalPrefix(`${env.API_PREFIX}/${API_VERSION}`);

  // Lets a container stop cleanly, so Prisma closes its connection pool.
  app.enableShutdownHooks();

  await app.listen(env.PORT);

  Logger.log(
    `API listening on http://localhost:${env.PORT}/${env.API_PREFIX}/${API_VERSION}`,
    'Bootstrap',
  );
}

void bootstrap();
