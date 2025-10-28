import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { ServiceModule } from './service/service.module';
import { CommentModule } from './comment/comment.module';
import { Project } from './project/entities/project.entity';
import { Service } from './service/entities/service.entity';
import { Comment } from './comment/entities/comment.entity';
import { CertificateModule } from './certificate/certificate.module';
import { Certificate } from './certificate/entities/certificate.entity';
import { TaskBoardModule } from './task-board/task-board.module';
import { CardModule } from './card/card.module';
import { TasksModule } from './tasks/tasks.module';
import { TaskBoard } from './task-board/entities/task-board.entity';
import { Card } from './card/entities/card.entity';

import { S3Module } from './s3/s3.module';
import { TestController } from './test.controller';
import { IssueModule } from './issue/issue.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AttachmentModule } from './attachment/attachment.module';
import { Issue } from './issue/entities/issue.entity';

@Module({
  imports: [
    ConfigModule.forRoot(
      {
        isGlobal: true,
        envFilePath: '.env',
      }
    ),
    TypeOrmModule.forRoot(
      {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        password: process.env.PASSWORD,
        username: 'postgres',
        entities: [ User, Project, Service, Comment, Certificate, TaskBoard, Card, Issue ],
        database: 'projectDB',
        synchronize: true,
        logging: true,
      }
    ),
    UserModule,
    AuthModule,
    ProjectModule,
    ServiceModule,
    CommentModule,
    CertificateModule,
    TaskBoardModule,
    CardModule,
    TasksModule,
    S3Module,
    IssueModule,
    FeedbackModule,
    AttachmentModule
  ],
  controllers: [ AppController, TestController ],
  providers: [ AppService ],
})
export class AppModule { }