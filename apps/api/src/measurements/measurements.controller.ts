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
import type {
  AuthenticatedUser,
  BodyMeasurement,
  MeasurementTrend,
  Paginated,
} from '@fitness/types';
import {
  createMeasurementSchema,
  measurementQuerySchema,
  measurementTrendQuerySchema,
  objectIdSchema,
  updateMeasurementSchema,
  type CreateMeasurementInput,
  type MeasurementQueryInput,
  type MeasurementTrendQueryInput,
  type UpdateMeasurementInput,
} from '@fitness/validation';

import { CurrentUser } from '../common/decorators';
import { zodPipe } from '../common/zod-validation.pipe';
import { MeasurementsService } from './measurements.service';

@Controller('measurements')
export class MeasurementsController {
  constructor(private readonly measurements: MeasurementsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(measurementQuerySchema)) query: MeasurementQueryInput,
  ): Promise<Paginated<BodyMeasurement>> {
    return this.measurements.list(user.id, query);
  }

  // Static segments must precede `:id` so they are not read as ids.
  @Get('latest')
  latest(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BodyMeasurement | null> {
    return this.measurements.findLatest(user.id);
  }

  @Get('trend')
  trend(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(measurementTrendQuerySchema))
    query: MeasurementTrendQueryInput,
  ): Promise<MeasurementTrend> {
    return this.measurements.trend(user.id, query);
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<BodyMeasurement> {
    return this.measurements.findById(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(createMeasurementSchema)) body: CreateMeasurementInput,
  ): Promise<BodyMeasurement> {
    return this.measurements.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(updateMeasurementSchema)) body: UpdateMeasurementInput,
  ): Promise<BodyMeasurement> {
    return this.measurements.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<void> {
    return this.measurements.remove(user.id, id);
  }
}
