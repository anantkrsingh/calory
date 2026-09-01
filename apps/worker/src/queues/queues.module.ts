import { Module } from '@nestjs/common';

import { AccountDeletionProcessor } from './account-deletion.processor';
import { OtpQueueProcessor } from './otp.processor';
import { QuoteProcessor } from './quote.processor';
import { RoutineProcessor } from './routine.processor';

@Module({
  providers: [
    OtpQueueProcessor,
    QuoteProcessor,
    RoutineProcessor,
    AccountDeletionProcessor,
  ],
})
export class QueuesModule {}
