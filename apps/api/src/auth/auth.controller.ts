import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  AuthProvider,
  type AuthSession,
  type AuthTokens,
  type AuthenticatedUser,
  type PendingVerification,
  type User,
} from '@fitness/types';
import {
  changePasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  socialLoginSchema,
  authSessionSchema,
  pendingVerificationSchema,
  userSchema,
  authTokensSchema,
  verifyRegistrationSchema,
  type ChangePasswordInput,
  type LoginInput,
  type RefreshTokenInput,
  type RegisterInput,
  type SocialLoginInput,
  type VerifyRegistrationInput,
} from '@fitness/validation';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser, Public } from '../common/decorators';
import { ApiZodBody, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';

@ApiTags('auth')
@ApiBearerAuth('access-token')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Create an account and send a verification code',
    description:
      'Saves the profile and any body measurement, leaves the account ' +
      'unverified, and emails an OTP. No tokens are issued until the code is ' +
      'verified at POST /auth/verify-registration.',
  })
  @ApiZodBody(registerSchema)
  @ApiZodResponse(pendingVerificationSchema, { status: 201, name: 'PendingVerification', description: 'Account pending verification' })
  @ApiResponse({ status: 409, description: 'Email is already registered' })
  register(
    @Body(zodPipe(registerSchema)) body: RegisterInput,
  ): Promise<PendingVerification> {
    return this.auth.register(body);
  }

  @Public()
  @Post('verify-registration')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify the emailed code and receive a session',
    description: 'Sets emailVerified to true and issues the token pair.',
  })
  @ApiZodBody(verifyRegistrationSchema)
  @ApiZodResponse(authSessionSchema, { status: 200, name: 'AuthSession', description: 'Email verified; session issued' })
  @ApiResponse({ status: 401, description: 'Code is invalid or expired' })
  verifyRegistration(
    @Body(zodPipe(verifyRegistrationSchema)) body: VerifyRegistrationInput,
  ): Promise<AuthSession> {
    return this.auth.verifyRegistration(body);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiZodBody(loginSchema)
  @ApiZodResponse(authSessionSchema, { status: 200, name: 'AuthSession', description: 'Session issued' })
  @ApiResponse({ status: 401, description: 'Incorrect email or password' })
  login(@Body(zodPipe(loginSchema)) body: LoginInput): Promise<AuthSession> {
    return this.auth.login(body);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in with Google',
    description:
      'Send the ID token from the native Google SDK as `token`. An account ' +
      'already registered with this email is linked rather than rejected.',
  })
  @ApiZodBody(socialLoginSchema)
  @ApiZodResponse(authSessionSchema, { status: 200, name: 'AuthSession', description: 'Session issued' })
  @ApiResponse({ status: 400, description: 'Token failed verification' })
  @ApiResponse({ status: 501, description: 'Google sign-in is not configured' })
  loginGoogle(
    @Body(zodPipe(socialLoginSchema)) body: SocialLoginInput,
  ): Promise<AuthSession> {
    return this.auth.loginSocial(AuthProvider.Google, body);
  }

  @Public()
  @Post('facebook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in with Facebook',
    description:
      'Send the access token from the native Facebook SDK as `token`. Request ' +
      'the `email` permission, or account creation has nothing to key on.',
  })
  @ApiZodBody(socialLoginSchema)
  @ApiZodResponse(authSessionSchema, { status: 200, name: 'AuthSession', description: 'Session issued' })
  @ApiResponse({ status: 400, description: 'Token failed verification' })
  @ApiResponse({ status: 409, description: 'Provider shared no email address' })
  @ApiResponse({ status: 501, description: 'Facebook sign-in is not configured' })
  loginFacebook(
    @Body(zodPipe(socialLoginSchema)) body: SocialLoginInput,
  ): Promise<AuthSession> {
    return this.auth.loginSocial(AuthProvider.Facebook, body);
  }

  @Public()
  @Post('x')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in with X',
    description:
      'X has no ID token: send the PKCE authorization code as `token`, along ' +
      'with the `redirectUri` and `codeVerifier` used to obtain it.',
  })
  @ApiZodBody(socialLoginSchema)
  @ApiZodResponse(authSessionSchema, { status: 200, name: 'AuthSession', description: 'Session issued' })
  @ApiResponse({ status: 400, description: 'Code exchange failed' })
  @ApiResponse({ status: 409, description: 'Provider shared no email address' })
  @ApiResponse({ status: 501, description: 'X sign-in is not configured' })
  loginX(
    @Body(zodPipe(socialLoginSchema)) body: SocialLoginInput,
  ): Promise<AuthSession> {
    return this.auth.loginSocial(AuthProvider.X, body);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange a refresh token for a new token pair',
    description: 'The refresh token rotates; the presented one stops working.',
  })
  @ApiZodBody(refreshTokenSchema)
  @ApiZodResponse(authTokensSchema, { status: 200, name: 'AuthTokens', description: 'New token pair issued' })
  @ApiResponse({ status: 401, description: 'Token is invalid, expired, or revoked' })
  refresh(
    @Body(zodPipe(refreshTokenSchema)) body: RefreshTokenInput,
  ): Promise<AuthTokens> {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current refresh token' })
  @ApiResponse({ status: 204, description: 'Session revoked' })
  logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.auth.logout(user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the signed-in user' })
  @ApiZodResponse(userSchema, { status: 200, name: 'User', description: 'The current user' })
  me(@CurrentUser() user: AuthenticatedUser): Promise<User> {
    return this.auth.me(user.id);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Change the password',
    description: 'Succeeding here signs out every other session.',
  })
  @ApiZodBody(changePasswordSchema)
  @ApiResponse({ status: 204, description: 'Password changed' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiResponse({ status: 409, description: 'Account has no password set' })
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(changePasswordSchema)) body: ChangePasswordInput,
  ): Promise<void> {
    return this.auth.changePassword(user.id, body);
  }
}
