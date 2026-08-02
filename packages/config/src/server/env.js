"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTest = exports.isProduction = exports.envSchema = void 0;
exports.loadEnv = loadEnv;
const zod_1 = require("zod");
const constants_1 = require("../constants");
/**
 * Server-side environment contract. Importing this module from the Expo app is a
 * mistake — it reads `process.env` and is only reachable via `@fitness/config/server`.
 */
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(['development', 'test', 'production'])
        .default('development'),
    PORT: zod_1.z.coerce.number().int().min(1).max(65535).default(3000),
    API_PREFIX: zod_1.z.string().min(1).default(constants_1.API_PREFIX),
    CORS_ORIGIN: zod_1.z.string().default('*'),
    MONGODB_URI: zod_1.z
        .string()
        .min(1, 'MONGODB_URI is required')
        .refine((value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'), 'MONGODB_URI must start with mongodb:// or mongodb+srv://'),
    JWT_SECRET: zod_1.z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    DEFAULT_PAGE_SIZE: zod_1.z.coerce
        .number()
        .int()
        .positive()
        .max(constants_1.PAGINATION.maxLimit)
        .default(constants_1.PAGINATION.defaultLimit),
});
/**
 * Parses and validates environment variables, failing fast with every problem
 * listed at once rather than one crash per missing key.
 */
function loadEnv(source = process.env) {
    const result = exports.envSchema.safeParse(source);
    if (!result.success) {
        const details = result.error.issues
            .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
            .join('\n');
        throw new Error(`Invalid environment configuration:\n${details}`);
    }
    return result.data;
}
const isProduction = (env) => env.NODE_ENV === 'production';
exports.isProduction = isProduction;
const isTest = (env) => env.NODE_ENV === 'test';
exports.isTest = isTest;
//# sourceMappingURL=env.js.map