import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import type { AuthenticatedUser, User } from '@fitness/types';
import { updateUserSchema, type UpdateUserInput } from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { zodPipe } from '../common/zod-validation.pipe';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<User> {
    return this.users.findById(user.id);
  }

  @Patch('me')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(updateUserSchema)) body: UpdateUserInput,
  ): Promise<User> {
    return this.users.update(user.id, body);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.users.remove(user.id);
  }
}
