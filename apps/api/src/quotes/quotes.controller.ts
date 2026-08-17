import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { DailyQuote } from '@fitness/types';
import { dailyQuoteSchema } from '@fitness/validation';

import { ApiZodResponse } from '../common/swagger';
import { QuotesService } from './quotes.service';

@ApiTags('quotes')
@ApiBearerAuth('access-token')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Get('today')
  @ApiOperation({
    summary: "Get today's motivational quote",
    description:
      'Falls back to the most recent quote if today\'s has not been generated yet.',
  })
  @ApiZodResponse(dailyQuoteSchema, {
    description: 'The quote of the day',
    name: 'DailyQuote',
  })
  @ApiResponse({ status: 404, description: 'No quote has been generated yet' })
  today(): Promise<DailyQuote> {
    return this.quotes.today();
  }
}
