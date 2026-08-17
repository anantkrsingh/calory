import { Module } from '@nestjs/common';

import { OtpQueueProcessor } from './otp.processor';
import { QuoteProcessor } from './quote.processor';
import { RoutineProcessor } from './routine.processor';

@Module({
  providers: [OtpQueueProcessor, QuoteProcessor, RoutineProcessor],
})
export class QueuesModule {}
