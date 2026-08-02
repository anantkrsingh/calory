import { z } from 'zod';
/**
 * Server-side environment contract. Importing this module from the Expo app is a
 * mistake — it reads `process.env` and is only reachable via `@fitness/config/server`.
 */
export declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        production: "production";
        test: "test";
    }>>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    API_PREFIX: z.ZodDefault<z.ZodString>;
    CORS_ORIGIN: z.ZodDefault<z.ZodString>;
    MONGODB_URI: z.ZodString;
    JWT_SECRET: z.ZodString;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    DEFAULT_PAGE_SIZE: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type Env = z.infer<typeof envSchema>;
/**
 * Parses and validates environment variables, failing fast with every problem
 * listed at once rather than one crash per missing key.
 */
export declare function loadEnv(source?: NodeJS.ProcessEnv): Env;
export declare const isProduction: (env: Env) => boolean;
export declare const isTest: (env: Env) => boolean;
//# sourceMappingURL=env.d.ts.map