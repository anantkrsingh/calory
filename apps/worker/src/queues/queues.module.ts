import { Module } from '@nestjs/common';

import { AccountDeletionProcessor } from './account-deletion.processor';
import { DietPlanProcessor } from './diet-plan.processor';
import { OtpQueueProcessor } from './otp.processor';
import { QuoteProcessor } from './quote.processor';
import { RoutineProcessor } from './routine.processor';

@Module({
  providers: [
    OtpQueueProcessor,
    QuoteProcessor,
    RoutineProcessor,
    DietPlanProcessor,
    AccountDeletionProcessor,
  ],
})
export class QueuesModule {}
