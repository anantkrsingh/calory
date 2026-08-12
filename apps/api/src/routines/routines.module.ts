import { Module } from '@nestjs/common';

import { RoutinesController } from './routines.controller';
import { RoutinesService } from './routines.service';
import { WorkoutRoutineController } from './workout-routine.controller';
import { WorkoutRoutineService } from './workout-routine.service';

@Module({
  controllers: [RoutinesController, WorkoutRoutineController],
  providers: [RoutinesService, WorkoutRoutineService],
  exports: [RoutinesService, WorkoutRoutineService],
})
export class RoutinesModule {}
