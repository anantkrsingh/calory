import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import type {
  AuthSession,
  AuthTokens,
  AuthenticatedUser,
  User,
} from '@fitness/types';
import {
  changePasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  type ChangePasswordInput,
  type LoginInput,
  type RefreshTokenInput,
  type RegisterInput,
} from '@fitness/validation';

import { CurrentUser, Public } from '../common/decorators';
import { zodPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(
    @Body(zodPipe(registerSchema)) body: RegisterInput,
  ): Promise<AuthSession> {
    return this.auth.register(body);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(zodPipe(loginSchema)) body: LoginInput): Promise<AuthSession> {
    return this.auth.login(body);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body(zodPipe(refreshTokenSchema)) body: RefreshTokenInput,
  ): Promise<AuthTokens> {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.auth.logout(user.id);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<User> {
    return this.auth.me(user.id);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(changePasswordSchema)) body: ChangePasswordInput,
  ): Promise<void> {
    return this.auth.changePassword(user.id, body);
  }
}
