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

  //  CREATE
  @Post(':userId')
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Param('userId') userId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ): Promise<Certificate> {
    console.log(' CREATE → certificate files received:', files?.length || 0);

    const uploadedFiles: { name: string; url: string }[] = [];
    if (files?.length) {
      for (const file of files) {
        const key = `certificates/${Date.now()}-${file.originalname}`;
        const keyPath = await this.s3Service.uploadBuffer(file.buffer, key, file.mimetype);
        uploadedFiles.push({ name: file.originalname, url: keyPath });
        console.log('✅ Uploaded to S3:', key);
      }
    }

    const dto: CreateCertificateDto = {
      name: body.name,
      type: body.type,
      issuingOrganization: body.issuingOrganization,
      issueDate: body.issueDate,
      expiryDate: body.expiryDate,
      description: body.description,
      certificateFile: uploadedFiles,
    };

    return this.certificateService.create(dto, userId);
  }

  // GET ALL
  @Get()
  findAll() {
    return this.certificateService.findAll();
  }

  //  GET BY USER
  @Get(':userId')
  async getByUser(@Param('userId') userId: number): Promise<Certificate[]> {
    return this.certificateService.getCertificatesByUserId(userId);
  }

  //  GET SINGLE CERTIFICATE (SIGNED URLS)
  @Get('item/:id')
  async findOne(@Param('id') id: string) {
    const cert = await this.certificateService.findOne(+id);
    if (cert.certificateFile?.length) {
      cert.certificateFile = await Promise.all(
        cert.certificateFile.map(async (f: any) => ({
          name: f.name ?? f.split('/').pop(),
          url: await this.s3Service.getSignedUrl(f.url ?? f, 3600),
        })),
      );
    }
    return cert;
  }

  //  UPDATE (upload new, delete old)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('newFiles'))
  async update(
    @Param('id') id: string,
    @UploadedFiles() newFiles: Express.Multer.File[],
    @Body() body: any,
  ) {
    console.log(' UPDATE → certificate files received:', newFiles?.length || 0);
    const dto: UpdateCertificateDto = { ...body };

    // Parse existing + deleted files
    let existingFiles: { name: string; url: string }[] = [];
    try {
      existingFiles = JSON.parse(body.certificateFile || '[]');
    } catch {
      existingFiles = [];
    }
    const filesToDelete = body.filesToDelete ? JSON.parse(body.filesToDelete) : [];

    //  Delete old ones 
    for (const f of filesToDelete) {
      try {
        let key = f.url;
        if (key.startsWith('http')) {
          const match = key.match(/iga-project-files\.s3\.me-south-1\.amazonaws\.com\/(.+?)(?:\?|$)/);
          if (match && match[1]) key = match[1];
        }
        await this.s3Service.deleteFile(key);
        console.log('🗑️ Deleted from S3:', key);
      } catch (err) {
        console.warn(' Could not delete:', f.url, err.message);
      }
    }

    //  Upload new ones
    const uploadedFiles: { name: string; url: string }[] = [];
    if (newFiles?.length) {
      for (const file of newFiles) {
        const key = `certificates/${Date.now()}-${file.originalname}`;
        const keyPath = await this.s3Service.uploadBuffer(file.buffer, key, file.mimetype);
        uploadedFiles.push({ name: file.originalname, url: keyPath });
      }
    }

    dto.certificateFile = [...(existingFiles || []), ...uploadedFiles];
    return this.certificateService.update(+id, dto);
  }

  //  DELETE
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const cert = await this.certificateService.findOne(+id);
    if (cert.certificateFile?.length) {
      for (const f of cert.certificateFile) {
        try {
          let key = f.url;
          if (key.startsWith('http')) {
            const match = key.match(/iga-project-files\.s3\.me-south-1\.amazonaws\.com\/(.+?)(?:\?|$)/);
            if (match && match[1]) key = match[1];
          }
          await this.s3Service.deleteFile(key);
          console.log(' Deleted from S3 (full remove):', key);
        } catch (err) {
          console.warn(' Could not delete from S3 on remove:', err.message);
        }
      }
    }
    await this.certificateService.remove(+id);
    return { message: `✅ Certificate ${id} deleted (including S3 files)` };
  }
}
