import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';
import { TasksController } from './tasks.controller';
import { Card } from 'src/card/entities/card.entity';
import { User } from 'src/user/entities/user.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([ TaskBoard, Card,User ]), // Ensure both entities are imported
  ],
  providers: [ TasksService ],
  controllers: [ TasksController ],
})
export class TasksModule { }
