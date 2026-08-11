import {
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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Plan } from '@fitness/types';
import {
  createPlanSchema,
  objectIdSchema,
  planSchema,
  updatePlanSchema,
  type CreatePlanInput,
  type UpdatePlanInput,
} from '@fitness/validation';

import { Roles } from '../auth/roles.guard';
import { ApiZodBody, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { PlansService } from './plans.service';

@ApiTags('plans')
@ApiBearerAuth('access-token')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'List all plans' })
  @ApiZodResponse(planSchema, { isArray: true, description: 'List of plans', name: 'Plan' })
  list(@Query('activeOnly') activeOnly?: string): Promise<Plan[]> {
    return this.plansService.list(activeOnly === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a plan by id' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(planSchema, { description: 'The plan', name: 'Plan' })
  get(@Param('id', zodPipe(objectIdSchema)) id: string): Promise<Plan> {
    return this.plansService.findById(id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a premium plan (admin only)' })
  @ApiZodBody(createPlanSchema)
  @ApiZodResponse(planSchema, { description: 'Created plan', name: 'Plan' })
  create(@Body(zodPipe(createPlanSchema)) body: CreatePlanInput): Promise<Plan> {
    return this.plansService.create(body);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a premium plan (admin only)' })
  @ApiZodBody(updatePlanSchema)
  @ApiZodResponse(planSchema, { description: 'Updated plan', name: 'Plan' })
  update(
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(updatePlanSchema)) body: UpdatePlanInput,
  ): Promise<Plan> {
    return this.plansService.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a premium plan (admin only)' })
  remove(@Param('id', zodPipe(objectIdSchema)) id: string): Promise<void> {
    return this.plansService.remove(id);
  }
}
