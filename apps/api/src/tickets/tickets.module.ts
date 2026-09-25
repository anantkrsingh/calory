import { Module } from '@nestjs/common';

import { UploadsModule } from '../uploads/uploads.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [UploadsModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
