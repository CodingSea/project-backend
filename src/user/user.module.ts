import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { CertificateModule } from 'src/certificate/certificate.module';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CertificateModule,
    S3Module,
  ],
  controllers: [UserController],
  providers: [UserService, AuthService, JwtService],
  exports: [UserService],
})
export class UserModule {}
