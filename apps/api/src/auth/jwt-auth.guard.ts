import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedUser, JwtPayload } from '@fitness/types';

import { AUTH } from '../config/constants';

import { IS_PUBLIC_KEY, type AuthenticatedRequest } from '../common/decorators';

/**
 * Applied globally in `AppModule`; routes opt out with `@Public()`. Verifying
 * here rather than per-controller means a new endpoint is authenticated by
 * default — the safe direction to fail.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const user: AuthenticatedUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    const header = request.headers[AUTH.headerName];
    if (typeof header !== 'string') return null;

    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== AUTH.scheme.toLowerCase()) return null;

    return token ?? null;
  }
}
