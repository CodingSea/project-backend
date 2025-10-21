import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CertificateService } from './certificate.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { Certificate } from './entities/certificate.entity';
import { S3Service } from 'src/s3/s3.service';
import { Express } from 'express';

@Controller('certificate')
export class CertificateController {
  constructor(
    private readonly certificateService: CertificateService,
    private readonly s3Service: S3Service,
  ) {}

  //  Create certificate with file uploads
  @Post(':userId')
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Param('userId') userId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createCertificateDto: CreateCertificateDto
  ): Promise<Certificate> {
    let fileUrls: string[] = [];

    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const key = `certificates/${Date.now()}-${file.originalname}`;
        return await this.s3Service.uploadBuffer(file.buffer, key, file.mimetype);
      });
      fileUrls = await Promise.all(uploadPromises);
    }

    return this.certificateService.create(createCertificateDto, userId, fileUrls);
  }

  @Get()
  findAll() {
    return this.certificateService.findAll();
  }

  @Get(':userId')
  async getCertificates(@Param('userId') userId: number): Promise<Certificate[]> {
    return await this.certificateService.getCertificatesByUserId(userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCertificateDto: UpdateCertificateDto) {
    return this.certificateService.update(+id, updateCertificateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.certificateService.remove(+id);
  }
}
