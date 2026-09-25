import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SUPPORT_TICKET_ADMIN_INCLUDE,
  paginate,
  toSkipTake,
  toSupportTicket,
  type Prisma,
} from '@fitness/db';
import type {
  Id,
  Paginated,
  SupportTicket,
  TicketAttachment,
} from '@fitness/types';
import type {
  AddTicketCommentInput,
  CreateTicketInput,
  ListTicketsQueryInput,
  ReopenTicketInput,
  UpdateTicketInput,
} from '@fitness/validation';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

const TICKET_ATTACHMENT_FOLDER = 'fitness-tracker/tickets';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async uploadAttachment(file: Express.Multer.File): Promise<TicketAttachment> {
    const image = await this.uploads.uploadImage(
      file,
      TICKET_ATTACHMENT_FOLDER,
    );

    return {
      url: image.url,
      publicId: image.publicId,
      resourceType: 'image',
      bytes: image.bytes ?? file.size,
      format: image.format,
      originalName: file.originalname,
      mimeType: file.mimetype,
      width: image.width,
      height: image.height,
    };
  }

  async create(
    userId: Id,
    userEmail: string,
    input: CreateTicketInput,
  ): Promise<SupportTicket> {
    const now = new Date();
    const row = await this.prisma.supportTicket.create({
      data: {
        userId,
        subject: input.subject,
        message: input.message,
        attachments: input.attachments,
        timeline: [
          {
            id: randomUUID(),
            type: 'created',
            actorRole: 'user',
            actorId: userId,
            actorName: userEmail,
            message: input.message,
            attachments: input.attachments,
            createdAt: now,
          },
        ],
      },
    });

    return toSupportTicket(row);
  }

  async addComment(
    userId: Id,
    userEmail: string,
    id: Id,
    input: AddTicketCommentInput,
  ): Promise<SupportTicket> {
    const current = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!current || current.userId !== userId) {
      throw new NotFoundException('Ticket not found');
    }

    const row = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        timeline: {
          push: {
            id: randomUUID(),
            type: 'comment',
            actorRole: 'user',
            actorId: userId,
            actorName: userEmail,
            message: input.message,
            attachments: input.attachments,
            createdAt: new Date(),
          },
        },
      },
    });

    return toSupportTicket(row);
  }

  async reopen(
    userId: Id,
    userEmail: string,
    id: Id,
    input: ReopenTicketInput,
  ): Promise<SupportTicket> {
    const current = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!current || current.userId !== userId) {
      throw new NotFoundException('Ticket not found');
    }
    if (current.status !== 'resolved' && current.status !== 'closed') {
      throw new BadRequestException(
        'Only resolved or closed tickets can be reopened',
      );
    }

    const row = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'open',
        timeline: {
          push: {
            id: randomUUID(),
            type: 'reopened',
            actorRole: 'user',
            actorId: userId,
            actorName: userEmail,
            message: input.message,
            fromStatus: current.status,
            toStatus: 'open',
            attachments: input.attachments,
            createdAt: new Date(),
          },
        },
      },
    });

    return toSupportTicket(row);
  }

  async listMine(
    userId: Id,
    query: ListTicketsQueryInput,
  ): Promise<Paginated<SupportTicket>> {
    const where: Prisma.SupportTicketWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };
    const { skip, take } = toSkipTake(query);

    const [rows, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return paginate(rows.map(toSupportTicket), query, total);
  }

  async listAll(
    query: ListTicketsQueryInput,
  ): Promise<Paginated<SupportTicket>> {
    const where: Prisma.SupportTicketWhereInput = query.status
      ? { status: query.status }
      : {};
    const { skip, take } = toSkipTake(query);

    const [rows, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: SUPPORT_TICKET_ADMIN_INCLUDE,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return paginate(rows.map(toSupportTicket), query, total);
  }

  async update(
    id: Id,
    reviewerId: Id,
    reviewerEmail: string,
    input: UpdateTicketInput,
  ): Promise<SupportTicket> {
    const current = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('Ticket not found');

    const nextStatus = input.status ?? current.status;
    const statusChanged = nextStatus !== current.status;
    const hasAdminNote =
      input.adminNote !== undefined && input.adminNote !== '';
    const row = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.adminNote !== undefined
          ? { adminNote: input.adminNote }
          : {}),
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        ...(statusChanged || hasAdminNote
          ? {
              timeline: {
                push: {
                  id: randomUUID(),
                  type: statusChanged ? 'status_change' : 'comment',
                  actorRole: 'admin',
                  actorId: reviewerId,
                  actorName: reviewerEmail,
                  message: hasAdminNote ? input.adminNote : undefined,
                  fromStatus: statusChanged ? current.status : undefined,
                  toStatus: statusChanged ? nextStatus : undefined,
                  attachments: [],
                  createdAt: new Date(),
                },
              },
            }
          : {}),
      },
      include: SUPPORT_TICKET_ADMIN_INCLUDE,
    });

    return toSupportTicket(row);
  }
}
