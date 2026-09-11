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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { PortionFood } from '@fitness/types';
import {
  createPortionFoodSchema,
  objectIdSchema,
  portionFoodSchema,
  updatePortionFoodSchema,
  type CreatePortionFoodInput,
  type UpdatePortionFoodInput,
} from '@fitness/validation';

import { Roles } from '../auth/roles.guard';
import { ApiZodBody, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { PortionsService } from './portions.service';

@ApiTags('portions')
@ApiBearerAuth('access-token')
@Controller('portions')
export class PortionsController {
  constructor(private readonly portions: PortionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List common foods in household portions',
    description:
      'Powers the quick-add picker. Portions are katori/roti/glass rather ' +
      'than grams, and every value is admin-editable.',
  })
  @ApiZodResponse(portionFoodSchema, {
    isArray: true,
    description: 'Portion foods',
    name: 'PortionFood',
  })
  list(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<PortionFood[]> {
    return this.portions.list(includeInactive === 'true');
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Add a portion food (admin only)' })
  @ApiZodBody(createPortionFoodSchema)
  @ApiZodResponse(portionFoodSchema, {
    description: 'Created',
    name: 'PortionFood',
  })
  create(
    @Body(zodPipe(createPortionFoodSchema)) body: CreatePortionFoodInput,
  ): Promise<PortionFood> {
    return this.portions.create(body);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a portion food (admin only)' })
  @ApiZodBody(updatePortionFoodSchema)
  @ApiZodResponse(portionFoodSchema, {
    description: 'Updated',
    name: 'PortionFood',
  })
  update(
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(updatePortionFoodSchema)) body: UpdatePortionFoodInput,
  ): Promise<PortionFood> {
    return this.portions.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a portion food (admin only)' })
  remove(@Param('id', zodPipe(objectIdSchema)) id: string): Promise<void> {
    return this.portions.remove(id);
  }
}
