import { Module } from '@nestjs/common';
import { TaskBoardService } from './task-board.service';
import { TaskBoardController } from './task-board.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from 'src/service/entities/service.entity';
import { User } from 'src/user/entities/user.entity';
import { TaskBoard } from './entities/task-board.entity';
import { Card } from 'src/card/entities/card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, User, TaskBoard, Card])],
  controllers: [TaskBoardController],
  providers: [TaskBoardService],
})
export class TaskBoardModule {}
