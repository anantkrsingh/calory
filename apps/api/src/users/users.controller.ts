import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser, Paginated, User } from '@fitness/types';
import {
  adminUpdateUserSchema,
  listUsersQuerySchema,
  objectIdSchema,
  updateUserSchema,
  userSchema,
  type AdminUpdateUserInput,
  type ListUsersQueryInput,
  type UpdateUserInput,
} from '@fitness/validation';

import { Roles } from '../auth/roles.guard';
import { CurrentUser } from '../common/decorators';
import { ApiZodBody, ApiZodQuery, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
} from '../uploads/uploads.service';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiZodQuery(listUsersQuerySchema)
  @ApiZodResponse(userSchema, {
    paginated: true,
    description: 'Page of users',
    name: 'User',
  })
  list(
    @Query(zodPipe(listUsersQuerySchema)) query: ListUsersQueryInput,
  ): Promise<Paginated<User>> {
    return this.users.list(query);
  }

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

  @Post('me/avatar')
  @ApiOperation({
    summary: 'Upload and set your profile avatar. JPEG/PNG/WebP/GIF, max 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiZodResponse(userSchema, { description: 'Updated profile', name: 'User' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException(
              'Unsupported image type. Use JPEG, PNG, WebP, or GIF.',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<User> {
    return this.users.updateAvatar(user.id, file);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete your account and all of its data' })
  remove(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.users.remove(user.id);
  }

  // Kept last: `:id` is a wildcard that would otherwise shadow the literal
  // `me` routes above if Nest registered it first.
  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get one user by id (admin only)' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(userSchema, { description: 'The user', name: 'User' })
  get(@Param('id', zodPipe(objectIdSchema)) id: string): Promise<User> {
    return this.users.findById(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Update user credits, plan, role, or profile (admin only)',
  })
  @ApiZodBody(adminUpdateUserSchema)
  @ApiZodResponse(userSchema, { description: 'Updated user', name: 'User' })
  adminUpdate(
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(adminUpdateUserSchema)) body: AdminUpdateUserInput,
  ): Promise<User> {
    return this.users.adminUpdate(id, body);
  }
}
