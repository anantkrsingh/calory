import type { Paginated, SupportTicket, TicketAttachment } from '@fitness/types';
import type {
  AddTicketCommentInput,
  CreateTicketInput,
  ListTicketsQueryInput,
  ReopenTicketInput,
} from '@fitness/validation';

import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';
import type { LocalImageFile } from '@/services/users.service';

import { BaseService } from './base.service';

const DEFAULT_TICKET_QUERY: ListTicketsQueryInput = { page: 1, limit: 20 };

export class TicketsService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/tickets', client);
  }

  async list(
    query: ListTicketsQueryInput = DEFAULT_TICKET_QUERY,
  ): Promise<Paginated<SupportTicket>> {
    const { data } = await this.client.get<Paginated<SupportTicket>>(this.path, {
      params: query,
    });
    return data;
  }

  async create(input: CreateTicketInput): Promise<SupportTicket> {
    const { data } = await this.client.post<SupportTicket>(this.path, input);
    return data;
  }

  async addComment(
    id: string,
    input: AddTicketCommentInput,
  ): Promise<SupportTicket> {
    const { data } = await this.client.post<SupportTicket>(
      this.url(id, 'comments'),
      input,
    );
    return data;
  }

  async reopen(id: string, input: ReopenTicketInput): Promise<SupportTicket> {
    const { data } = await this.client.post<SupportTicket>(
      this.url(id, 'reopen'),
      input,
    );
    return data;
  }

  async uploadAttachment(file: LocalImageFile): Promise<TicketAttachment> {
    const form = new FormData();
    // React Native's FormData file part accepts only this shape. Passing the
    // picker asset through with extra fields (for example `size`) can throw
    // "Unsupported FormDataPart implementation" before the request is sent.
    form.append(
      'file',
      {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob,
    );

    const { data } = await this.client.post<TicketAttachment>(
      this.url('attachments'),
      form,
      { headers: { 'content-type': 'multipart/form-data' } },
    );
    return data;
  }
}

export const ticketsService = new TicketsService();
