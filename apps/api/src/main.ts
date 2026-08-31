import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import helmet from 'helmet';

import { apiErrorSchema } from '@fitness/validation';

import { AppModule } from './app.module';
import { registerSchema, registeredSchemas } from './common/swagger';
import { API_VERSION } from './config/constants';
import { ENV, type Env } from './config/env.module';

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

  if (env.NODE_ENV !== 'production' || env.SWAGGER_ENABLED) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Fitness Tracker API')
        .setDescription(
          'REST API for the fitness tracker mobile app. All routes require a ' +
            'Bearer access token unless marked otherwise.',
        )
        .setVersion(API_VERSION)
        .addBearerAuth(
          { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          'access-token',
        )
        .build(),
    );

    registerSchema('ApiError', apiErrorSchema);

    document.components = {
      ...document.components,
      schemas: { ...document.components?.schemas, ...registeredSchemas() },
    };

    type PathItem = OpenAPIObject['paths'][string];
    type Operation = NonNullable<PathItem['get']>;
    const methods = [
      'get',
      'put',
      'post',
      'delete',
      'options',
      'head',
      'patch',
      'trace',
    ] as const satisfies readonly (keyof PathItem)[];

    for (const path of Object.values(document.paths)) {
      const operations = methods
        .map((method) => path[method])
        .filter((operation): operation is Operation => !!operation);

      for (const operation of operations) {
        if (!operation.security?.length) continue;
        operation.responses['401'] ??= {
          description: 'Missing or invalid access token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        };
      }
    }

    SwaggerModule.setup(`${env.API_PREFIX}/docs`, app, document, {
      jsonDocumentUrl: `${env.API_PREFIX}/docs-json`,
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // Lets a container stop cleanly, so Prisma closes its connection pool.
  app.enableShutdownHooks();

  await app.listen(env.PORT);

  Logger.log(
    `API listening on http://localhost:${env.PORT}/${env.API_PREFIX}/${API_VERSION}`,
    'Bootstrap',
  );
}

void bootstrap();
