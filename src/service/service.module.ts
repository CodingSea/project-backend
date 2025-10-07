import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entities/user.entity';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Project, User, TaskBoard])],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService],
})
export class ServiceModule {}
