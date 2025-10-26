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
import { Express } from 'express';
import { TasksService } from 'src/tasks/tasks.service';
import { Card } from 'src/card/entities/card.entity';
import { CreateCardDto } from 'src/card/dto/create-card.dto';
import { UpdateCardDto } from 'src/card/dto/update-card.dto';

@Controller('service')
export class ServiceController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly s3Service: S3Service,
    private readonly tasksService: TasksService,
  ) {}

  // ✅ CREATE SERVICE (with S3 upload)
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    console.log('🔥 CREATE → files received:', files?.length || 0);

    const uploadedFiles: { name: string; url: string }[] = [];
    if (files?.length) {
      for (const file of files) {
        const key = `services/${Date.now()}-${file.originalname}`;
        const keyPath = await this.s3Service.uploadBuffer(file.buffer, key, file.mimetype);
        uploadedFiles.push({ name: file.originalname, url: keyPath });
        console.log('✅ Uploaded to S3:', key);
      }
    }

    const dto: CreateServiceDto = {
      name: body.name,
      description: body.description,
      deadline: body.deadline,
      projectId: Number(body.projectId),
      chiefId: Number(body.chiefId),
      managerId: body.managerId ? Number(body.managerId) : undefined,
      resources: Array.isArray(body.resources)
        ? body.resources.map((r: any) => Number(r))
        : body.resources
        ? [Number(body.resources)]
        : [],
      files: uploadedFiles,
    };

    return this.serviceService.create(dto);
  }

  // ✅ GET ALL SERVICES
  @Get()
  findAll() {
    return this.serviceService.findAll();
  }

  // ✅ GET ONE SERVICE (with signed URLs)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const svc = await this.serviceService.findOne(+id);
    if (svc.files?.length) {
      svc.files = await Promise.all(
        svc.files.map(async (f) => ({
          name: f.name,
          url: await this.s3Service.getSignedUrl(f.url, 3600),
        })),
      );
    }
    return svc;
  }

  // ✅ UPDATE SERVICE (upload new, delete old)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('newFiles'))
  async update(
    @Param('id') id: string,
    @UploadedFiles() newFiles: Express.Multer.File[],
    @Body() body: any,
  ) {
    console.log('🔥 UPDATE → files received:', newFiles?.length || 0);

    const dto: UpdateServiceDto = { ...body };
    if (typeof dto.files === 'string') dto.files = JSON.parse(dto.files || '[]');
    const filesToDelete = body.filesToDelete ? JSON.parse(body.filesToDelete) : [];

    // 🗑️ Delete old files from S3
    for (const f of filesToDelete) {
      try {
        let key = f.url;
        if (key.startsWith('http')) {
          const match = key.match(/iga-project-files\.s3\.me-south-1\.amazonaws\.com\/(.+?)(?:\?|$)/);
          if (match && match[1]) key = match[1];
        }
        await this.s3Service.deleteFile(key);
        console.log('🗑️ Deleted:', key);
      } catch (err) {
        console.warn('⚠️ Could not delete:', f.url, err.message);
      }
    }

    // 📤 Upload new files
    const uploadedFiles: { name: string; url: string }[] = [];
    if (newFiles?.length) {
      for (const file of newFiles) {
        const key = `services/${Date.now()}-${file.originalname}`;
        const keyPath = await this.s3Service.uploadBuffer(file.buffer, key, file.mimetype);
        uploadedFiles.push({ name: file.originalname, url: keyPath });
      }
    }

    dto.files = [...(dto.files || []), ...uploadedFiles];
    return this.serviceService.update(+id, dto);
  }

  // ✅ DELETE SERVICE
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceService.remove(+id);
  }

  // ✅ GET SERVICES BY USER
  @Get('user/:id')
  async getServicesByUser(@Param('id') userId: number): Promise<any[]> {
    const services = await this.serviceService.getAllServicesForUser(userId);
    return services.length ? services : [];
  }

  // ✅ TASKBOARD ROUTES
  @Get(':serviceId/tasks')
  async getCards(@Param('serviceId') serviceId: number): Promise<Card[]> {
    return this.tasksService.getCardsFromTaskBoard(serviceId);
  }

  @Post(':taskBoardId/cards')
  async createCard(
    @Param('taskBoardId') taskBoardId: number,
    @Body() createCardDto: CreateCardDto,
  ) {
    return this.tasksService.createCardIfNotExists(taskBoardId, createCardDto);
  }

  @Patch(':taskBoardId/tasks/:cardId')
  async updateCard(
    @Param('taskBoardId') taskBoardId: number,
    @Param('cardId') cardId: number,
    @Body() updateCardDto: UpdateCardDto,
  ): Promise<Card> {
    return this.tasksService.updateCard(taskBoardId, cardId, updateCardDto);
  }

  @Delete(':taskBoardId/tasks/:cardId')
  async deleteCard(@Param('cardId') cardId: number): Promise<void> {
    return this.tasksService.deleteCard(cardId);
  }
}
