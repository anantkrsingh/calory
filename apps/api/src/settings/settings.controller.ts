import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AppSettings } from '@fitness/types';
import {
  appSettingsSchema,
  updateSettingsSchema,
  type UpdateSettingsInput,
} from '@fitness/validation';

import { Roles } from '../auth/roles.guard';
import { ApiZodBody, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get app-wide configuration (admin only)' })
  @ApiZodResponse(appSettingsSchema, { description: 'Current settings', name: 'AppSettings' })
  get(): Promise<AppSettings> {
    return this.settings.get();
  }

  @Patch()
  @ApiOperation({ summary: 'Update app-wide configuration (admin only)' })
  @ApiZodBody(updateSettingsSchema)
  @ApiZodResponse(appSettingsSchema, { description: 'Updated settings', name: 'AppSettings' })
  update(
    @Body(zodPipe(updateSettingsSchema)) body: UpdateSettingsInput,
  ): Promise<AppSettings> {
    return this.settings.update(body);
  }
}
