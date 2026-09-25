import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
import type {
  AuthenticatedUser,
  Paginated,
  SupportTicket,
  TicketAttachment,
} from '@fitness/types';
import {
  addTicketCommentSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  objectIdSchema,
  reopenTicketSchema,
  supportTicketSchema,
  ticketAttachmentSchema,
  updateTicketSchema,
  type AddTicketCommentInput,
  type CreateTicketInput,
  type ListTicketsQueryInput,
  type ReopenTicketInput,
  type UpdateTicketInput,
} from '@fitness/validation';

import { Roles } from '../auth/roles.guard';
import { CurrentUser } from '../common/decorators';
import { ApiZodBody, ApiZodQuery, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
} from '../uploads/uploads.service';
import { TicketsService } from './tickets.service';

@ApiTags('tickets')
@ApiBearerAuth('access-token')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Post('attachments')
  @ApiOperation({
    summary:
      'Upload a support ticket image attachment to Cloudinary. Max 5MB. Uses in-memory upload; no temp file is persisted.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiZodResponse(ticketAttachmentSchema, {
    status: 201,
    name: 'TicketAttachment',
    description: 'Uploaded attachment metadata',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException(
              'Unsupported attachment type. Use JPEG, PNG, WebP, GIF, HEIC, or HEIF.',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<TicketAttachment> {
    try {
      return await this.tickets.uploadAttachment(file);
    } finally {
      if (file) {
        file.buffer = Buffer.alloc(0);
      }
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a support ticket' })
  @ApiZodBody(createTicketSchema)
  @ApiZodResponse(supportTicketSchema, {
    status: 201,
    name: 'SupportTicket',
    description: 'The created support ticket',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(createTicketSchema)) body: CreateTicketInput,
  ): Promise<SupportTicket> {
    return this.tickets.create(user.id, user.email, body);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to one of your support tickets' })
  @ApiZodBody(addTicketCommentSchema)
  @ApiZodResponse(supportTicketSchema, {
    name: 'SupportTicket',
    description: 'The updated ticket with timeline',
  })
  addComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(addTicketCommentSchema)) body: AddTicketCommentInput,
  ): Promise<SupportTicket> {
    return this.tickets.addComment(user.id, user.email, id, body);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen one of your resolved or closed tickets' })
  @ApiZodBody(reopenTicketSchema)
  @ApiZodResponse(supportTicketSchema, {
    name: 'SupportTicket',
    description: 'The reopened ticket with timeline',
  })
  reopen(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(reopenTicketSchema)) body: ReopenTicketInput,
  ): Promise<SupportTicket> {
    return this.tickets.reopen(user.id, user.email, id, body);
  }

  @Get()
  @ApiOperation({ summary: "List the current user's support tickets" })
  @ApiZodQuery(listTicketsQuerySchema)
  @ApiZodResponse(supportTicketSchema, {
    paginated: true,
    name: 'SupportTicket',
    description: 'Page of support tickets, newest first',
  })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(listTicketsQuerySchema)) query: ListTicketsQueryInput,
  ): Promise<Paginated<SupportTicket>> {
    return this.tickets.listMine(user.id, query);
  }

  @Get('admin')
  @Roles('admin')
  @ApiOperation({ summary: 'List all support tickets (admin only)' })
  @ApiZodQuery(listTicketsQuerySchema)
  @ApiZodResponse(supportTicketSchema, {
    paginated: true,
    name: 'SupportTicket',
    description: 'Page of support tickets with user details, newest first',
  })
  listAll(
    @Query(zodPipe(listTicketsQuerySchema)) query: ListTicketsQueryInput,
  ): Promise<Paginated<SupportTicket>> {
    return this.tickets.listAll(query);
  }

  @Patch('admin/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Review/update a support ticket (admin only)' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodBody(updateTicketSchema)
  @ApiZodResponse(supportTicketSchema, {
    name: 'SupportTicket',
    description: 'The updated support ticket',
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(updateTicketSchema)) body: UpdateTicketInput,
  ): Promise<SupportTicket> {
    return this.tickets.update(id, user.id, user.email, body);
  }
}
