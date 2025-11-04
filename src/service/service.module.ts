import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entities/user.entity';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';
import { Card } from 'src/card/entities/card.entity';
import { TasksController } from 'src/tasks/tasks.controller';
import { TasksService } from 'src/tasks/tasks.service';

import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';

import { S3Module } from 'src/s3/s3.module';
import { MulterModule } from '@nestjs/platform-express';
import { Issue } from 'src/issue/entities/issue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Project, User, TaskBoard, Card, Issue]),
  S3Module,
  MulterModule.register({})
  ],
  controllers: [ServiceController, TasksController],
  providers: [ServiceService, TasksService],
  exports: [ServiceService],
})
export class ServiceModule {}