import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { ApiErrorBody } from '@fitness/types';
import { Prisma } from '@fitness/db';
import type { Request, Response } from 'express';

/**
 * Normalises every failure into the single `ApiErrorBody` shape the client is
 * typed against, so `ApiError.fieldError('email')` works no matter whether the
 * rejection came from Zod, Prisma, or an explicit throw.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error, details } = this.describe(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiErrorBody = {
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(details ? { details } : {}),
    };

    response.status(status).json(body);
  }

  private describe(exception: unknown): {
    status: number;
    message: string;
    error: string;
    details?: Record<string, string[]>;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return { status, message: payload, error: exception.name };
      }

      const record = payload as {
        message?: string | string[];
        error?: string;
        details?: Record<string, string[]>;
      };

      return {
        status,
        message: Array.isArray(record.message)
          ? record.message.join(', ')
          : (record.message ?? exception.message),
        error: record.error ?? exception.name,
        ...(record.details ? { details: record.details } : {}),
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.describePrisma(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid database query',
        error: 'PrismaClientValidationError',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'InternalServerError',
    };
  }

  private describePrisma(
    exception: Prisma.PrismaClientKnownRequestError,
  ): { status: number; message: string; error: string; details?: Record<string, string[]> } {
    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation — surface the offending field to the form.
        const target = exception.meta?.['target'];
        const fields = Array.isArray(target) ? (target as string[]) : [];
        return {
          status: HttpStatus.CONFLICT,
          message: 'A record with these values already exists',
          error: 'Conflict',
          details: Object.fromEntries(
            fields.map((field) => [field, ['Already taken']]),
          ),
        };
      }
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'NotFound',
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          message: `Database error (${exception.code})`,
          error: 'PrismaClientKnownRequestError',
        };
    }
  }
}
