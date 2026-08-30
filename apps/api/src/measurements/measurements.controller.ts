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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {
  AuthenticatedUser,
  BodyMeasurement,
  MeasurementTrend,
  Paginated,
} from '@fitness/types';
import {
  bodyMeasurementSchema,
  measurementTrendSchema,
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
import { ApiZodBody, ApiZodQuery, ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import { MeasurementsService } from './measurements.service';

@ApiTags('measurements')
@ApiBearerAuth('access-token')
@Controller('measurements')
export class MeasurementsController {
  constructor(private readonly measurements: MeasurementsService) {}

  @Get()
  @ApiOperation({ summary: 'List body measurements, newest first' })
  @ApiZodQuery(measurementQuerySchema)
  @ApiZodResponse(bodyMeasurementSchema, {
    paginated: true,
    description: 'Page of measurements',
    name: 'BodyMeasurement',
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(measurementQuerySchema)) query: MeasurementQueryInput,
  ): Promise<Paginated<BodyMeasurement>> {
    return this.measurements.list(user.id, query);
  }

  // Static segments must precede `:id` so they are not read as ids.
  @Get('latest')
  @ApiOperation({ summary: 'Get the most recent measurement, or null' })
  @ApiZodResponse(bodyMeasurementSchema, {
    description: 'Most recent measurement, or null',
    name: 'BodyMeasurement',
  })
  latest(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BodyMeasurement | null> {
    return this.measurements.findLatest(user.id);
  }

  @Get('trend')
  @ApiOperation({ summary: 'Get a measurement series over a date range' })
  @ApiZodQuery(measurementTrendQuerySchema)
  @ApiZodResponse(measurementTrendSchema, {
    description: 'Measurement series',
    name: 'MeasurementTrend',
  })
  trend(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodPipe(measurementTrendQuerySchema))
    query: MeasurementTrendQueryInput,
  ): Promise<MeasurementTrend> {
    return this.measurements.trend(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one measurement' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(bodyMeasurementSchema, {
    description: 'The measurement',
    name: 'BodyMeasurement',
  })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<BodyMeasurement> {
    return this.measurements.findById(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Record a body measurement' })
  @ApiZodBody(createMeasurementSchema)
  @ApiZodResponse(bodyMeasurementSchema, {
    status: 201,
    description: 'Created measurement',
    name: 'BodyMeasurement',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodPipe(createMeasurementSchema)) body: CreateMeasurementInput,
  ): Promise<BodyMeasurement> {
    return this.measurements.create(user.id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a measurement' })
  @ApiZodBody(updateMeasurementSchema)
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiZodResponse(bodyMeasurementSchema, {
    description: 'Updated measurement',
    name: 'BodyMeasurement',
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
    @Body(zodPipe(updateMeasurementSchema)) body: UpdateMeasurementInput,
  ): Promise<BodyMeasurement> {
    return this.measurements.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a measurement' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', zodPipe(objectIdSchema)) id: string,
  ): Promise<void> {
    return this.measurements.remove(user.id, id);
  }
}
