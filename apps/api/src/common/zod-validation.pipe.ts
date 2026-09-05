import {
  BadRequestException,
  Injectable,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common';
import { formatIssues } from '@fitness/validation';
import type { ZodType } from 'zod';

/**
 * Validates a handler argument against a Zod schema, replacing Nest's
 * class-validator DTOs. The schemas live in `@fitness/validation`, so the mobile
 * app validates a form against exactly the rules the API enforces.
 *
 * Usage: `@Body(new ZodValidationPipe(createWorkoutSchema)) body: CreateWorkoutInput`
 */
@Injectable()
export class ZodValidationPipe<T extends ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    // A POST/PATCH sent with no body and no JSON content-type leaves
    // `@Body()` as `undefined` (Express never defaults it to `{}`) — treat
    // that the same as an explicit `{}` so an all-optional/all-defaulted
    // schema (e.g. `generateDietPlanSchema`) doesn't reject a legitimately
    // bodyless call. A schema with required fields still 400s against `{}`.
    const input = value ?? {};
    const result = this.schema.safeParse(input);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: formatIssues(result.error),
      });
    }

    return result.data;
  }
}

/** Terser call site: `@Query(zodPipe(workoutQuerySchema))`. */
export const zodPipe = <T extends ZodType>(schema: T): ZodValidationPipe<T> =>
  new ZodValidationPipe(schema);
