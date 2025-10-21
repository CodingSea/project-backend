import { Module } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { CertificateController } from './certificate.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from './entities/certificate.entity';
import { User } from 'src/user/entities/user.entity';
import { S3Module } from 'src/s3/s3.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([Certificate, User]),
    S3Module,
    MulterModule.register({}),
  ],
  controllers: [CertificateController],
  providers: [CertificateService],
})
export class CertificateModule {}
