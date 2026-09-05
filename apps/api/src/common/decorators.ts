import {
  SetMetadata,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { AuthenticatedUser } from '@fitness/types';
import type { Request } from 'express';

export const IS_PUBLIC_KEY = 'isPublic';

/** Opts a route out of the globally applied JWT guard. */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Injects the principal the JWT guard attached. Non-optional by design: reaching
 * a handler without a user means the guard was bypassed, which is a bug, not a
 * case to handle at every call site.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new Error(
        'CurrentUser used on a route without JwtAuthGuard — check @Public().',
      );
    }

    return data ? user[data] : user;
  },
);

/**
 * Best-effort client IP for IP-based defaults (see `resolveDietCuisine`).
 * Prefers `X-Forwarded-For`'s first hop since the API sits behind a reverse
 * proxy/load balancer in every deployed environment; falls back to the
 * socket address for direct connections (e.g. local dev).
 */
export const ClientIp = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const forwardedFor = request.headers['x-forwarded-for'];
    const first = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0];
    return first?.trim() || request.socket.remoteAddress || undefined;
  },
);
