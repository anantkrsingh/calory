import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { paginationMetaSchema } from '@fitness/validation';
import { z, type ZodType } from 'zod';

type SchemaObject = Record<string, unknown>;
type ReferenceObject = { $ref: string };

const registry = new Map<string, SchemaObject>();

const toJsonSchema = (schema: ZodType, io: 'input' | 'output') => {
  const json = z.toJSONSchema(schema, { io, target: 'draft-2020-12' }) as Record<
    string,
    unknown
  >;
  delete json.$schema;
  return json as SchemaObject;
};

export const ApiZodBody = (schema: ZodType): MethodDecorator =>
  ApiBody({ schema: toJsonSchema(schema, 'input') });

export function ApiZodQuery(schema: ZodType): MethodDecorator {
  const json = toJsonSchema(schema, 'input');
  const properties = (json.properties ?? {}) as Record<string, SchemaObject>;
  const required = new Set((json.required ?? []) as string[]);

  return applyDecorators(
    ...Object.entries(properties).map(([name, property]) =>
      ApiQuery({ name, required: required.has(name), schema: property }),
    ),
  );
}

export function registerSchema(name: string, schema: ZodType): ReferenceObject {
  if (!registry.has(name)) registry.set(name, toJsonSchema(schema, 'output'));
  return { $ref: `#/components/schemas/${name}` };
}

export const registeredSchemas = (): Record<string, SchemaObject> =>
  Object.fromEntries(registry);

interface ZodResponseOptions {
  status?: number;
  description?: string;
  name?: string;
  isArray?: boolean;
  paginated?: boolean;
}

export function ApiZodResponse(
  schema: ZodType,
  options: ZodResponseOptions = {},
): MethodDecorator {
  const {
    status = 200,
    description,
    name,
    isArray = false,
    paginated = false,
  } = options;

  const base = name ? registerSchema(name, schema) : toJsonSchema(schema, 'output');

  if (paginated) {
    return ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        properties: {
          items: { type: 'array', items: base },
          meta: registerSchema('PaginationMeta', paginationMetaSchema),
        },
        required: ['items', 'meta'],
      },
    });
  }

  return ApiResponse({
    status,
    description,
    schema: isArray ? { type: 'array', items: base } : base,
  });
}
