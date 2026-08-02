import { Global, Module } from '@nestjs/common';
import { loadEnv, type Env } from '@fitness/config/server';

/** DI token for the validated environment. */
export const ENV = Symbol('ENV');

export type { Env };

/**
 * Validates the environment exactly once at boot. Anything missing or malformed
 * fails here with every problem listed, rather than surfacing as a null deref
 * halfway through the first request.
 */
@Global()
@Module({
  providers: [
    {
      provide: ENV,
      useFactory: (): Env => loadEnv(),
    },
  ],
  exports: [ENV],
})
export class EnvModule {}
