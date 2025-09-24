import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';


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
        entities: [User],
        database: 'projectDB',
        synchronize: true,
        logging: true,
      }
    ),
    UserModule
  ],
  controllers: [ AppController ],
  providers: [ AppService ],
})
export class AppModule { }
