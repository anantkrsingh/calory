import type { User } from '@fitness/types';
import type { UpdateUserInput } from '@fitness/validation';

import type { AxiosInstance } from 'axios';

import { http } from '@/api/http';

import { BaseService } from './base.service';

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
}

export const usersService = new UsersService();
