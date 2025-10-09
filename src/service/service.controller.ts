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
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { S3Service } from 'src/s3/s3.service';
import { Express } from 'express'; // ✅ Added import for Express types

@Controller('services')
export class ServiceController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly s3Service: S3Service,
  ) {}

  // ✅ Create service + upload attachments
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async createServiceWithFiles(
    @Body() dto: CreateServiceDto,
    @UploadedFiles() files: Express.Multer.File[], // ✅ Fixed typing
  ) {
    // Step 1: Create the service entry in DB
    const service = await this.serviceService.create(dto);

    // Step 2: Upload each file to S3 under folder /services/{id}/
    const urls: string[] = [];
    for (const file of files) {
      const key = `services/${service.serviceID}/${Date.now()}-${file.originalname}`;
      const url = await this.s3Service.uploadBuffer(file.buffer, key);
      urls.push(url);
    }

    // Step 3: Save attachment URLs in DB
    if (urls.length > 0) {
      await this.serviceService.addAttachments(service.serviceID, urls);
    }

    return {
      message: 'Service created successfully',
      service,
      attachments: urls,
    };
  }

  @Get()
  findAll() {
    return this.serviceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.serviceService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceService.remove(+id);
  }
}
