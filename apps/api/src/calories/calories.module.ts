import { Module } from '@nestjs/common';

import { SettingsModule } from '../settings/settings.module';
import { CaloriesController } from './calories.controller';
import { CaloriesService } from './calories.service';

@Module({
  imports: [SettingsModule],
  controllers: [CaloriesController],
  providers: [CaloriesService],
  exports: [CaloriesService],
})
export class CaloriesModule {}
