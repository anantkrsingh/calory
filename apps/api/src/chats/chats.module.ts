import { Module } from '@nestjs/common';

import { DietPlansModule } from '../diets/diet-plans.module';
import { ExercisesModule } from '../exercises/exercises.module';
import { RoutinesModule } from '../routines/routines.module';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';

@Module({
  imports: [RoutinesModule, ExercisesModule, DietPlansModule],
  controllers: [ChatsController],
  providers: [ChatsService],
  exports: [ChatsService],
})
export class ChatsModule {}
