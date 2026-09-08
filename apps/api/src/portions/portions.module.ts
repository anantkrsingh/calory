import { Module } from '@nestjs/common';

import { PortionsController } from './portions.controller';
import { PortionsService } from './portions.service';

@Module({
  controllers: [PortionsController],
  providers: [PortionsService],
  exports: [PortionsService],
})
export class PortionsModule {}
