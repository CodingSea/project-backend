import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entities/user.entity';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';

// ⬇️ bring in the module that exports S3Service
import { S3Module } from 'src/s3/s3.module';

// (optional) if you want to customize Multer config
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, Project, User]),
    S3Module,                 // ⬅️ THIS fixes the DI error
    MulterModule.register({}) // ⬅️ optional
  ],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService],
})
export class ServiceModule {}
