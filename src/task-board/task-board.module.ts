import { Module } from '@nestjs/common';
import { TaskBoardService } from './task-board.service';
import { TaskBoardController } from './task-board.controller';

@Module({
  controllers: [TaskBoardController],
  providers: [TaskBoardService],
})
export class TaskBoardModule {}
