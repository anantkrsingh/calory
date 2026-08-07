import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser, User } from '@fitness/types';
import {
  updateUserSchema,
  userSchema,
  type UpdateUserInput,
} from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { ApiZodBody, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get your profile and preferences' })
  @ApiZodResponse(userSchema, { description: 'Your profile', name: 'User' })
  me(@CurrentUser() user: AuthenticatedUser): Promise<User> {
    return this.users.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update your profile or preferences' })
  @ApiZodBody(updateUserSchema)
  @ApiZodResponse(userSchema, { description: 'Updated profile', name: 'User' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(updateUserSchema)) body: UpdateUserInput,
  ): Promise<User> {
    return this.users.update(user.id, body);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete your account and all of its data' })
  remove(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.users.remove(user.id);
  }
}
