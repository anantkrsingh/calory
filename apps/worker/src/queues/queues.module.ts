import { Module } from '@nestjs/common';

import { OtpQueueProcessor } from './otp.processor';

@Module({
  providers: [OtpQueueProcessor],
})
export class QueuesModule {}
