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
        entities: [User, Project, Service, Comment],
        database: 'projectDB',
        synchronize: true,
        logging: true,
      }
    ),
    UserModule,
    AuthModule,
    ProjectModule,
    ServiceModule,
    CommentModule
  ],
  controllers: [ AppController ],
  providers: [ AppService ],
})
export class AppModule { }
