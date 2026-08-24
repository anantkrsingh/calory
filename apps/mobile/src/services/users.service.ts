import type { User } from '@fitness/types';
import type { UpdateUserInput } from '@fitness/validation';

import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';

import { BaseService } from './base.service';

/** What `expo-image-picker`/RN's `Asset` gives you — enough to build a multipart part. */
export type LocalImageFile = {
  uri: string;
  name: string;
  type: string;
};

export class UsersService extends BaseService {
  constructor(client: AxiosInstance = http) {
    super('/users', client);
  }

  async me(): Promise<User> {
    const { data } = await this.client.get<User>(this.url('me'));
    return data;
  }

  async update(input: UpdateUserInput): Promise<User> {
    const { data } = await this.client.patch<User>(this.url('me'), input);
    return data;
  }

  async uploadAvatar(file: LocalImageFile): Promise<User> {
    const form = new FormData();
    // RN's FormData accepts this `{ uri, name, type }` shape directly; the
    // DOM `Blob`-based FormData types don't model it, hence the cast.
    form.append('file', file as unknown as Blob);

    const { data } = await this.client.post<User>(this.url('me', 'avatar'), form, {
      headers: { 'content-type': 'multipart/form-data' },
    });
    return data;
  }
}

export const usersService = new UsersService();
