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
  Query,
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
import { ServiceStatus } from './entities/service.entity';

@Controller('service')
export class ServiceController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly s3Service: S3Service,
    private readonly tasksService: TasksService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    const uploadedFiles: { name: string; url: string }[] = [];
    if (files?.length) {
      for (const file of files) {
        const key = `services/${Date.now()}-${file.originalname}`;
        const keyPath = await this.s3Service.uploadBuffer(file.buffer, key, file.mimetype);
        uploadedFiles.push({ name: file.originalname, url: keyPath });
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

  // ✅ GET ALL SERVICES (with optional search & filter)
  @Get()
  async findAllFiltered(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    if (search || status) {
      return this.serviceService.findAllFiltered(search, status);
    }
    return this.serviceService.findAll();
  }

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

  @Get(':id/issue')
  async getServiceIssue(@Param('id') id: string) {
    const svc = await this.serviceService.findOne(+id);
    return svc.issue;
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('newFiles'))
  async update(
    @Param('id') id: string,
    @UploadedFiles() newFiles: Express.Multer.File[],
    @Body() body: any,
  ) {
    console.log('UPDATE → files received:', newFiles?.length || 0);

    const dto: UpdateServiceDto = { ...body };
    if (typeof dto.files === 'string') dto.files = JSON.parse(dto.files || '[]');
    const filesToDelete = body.filesToDelete ? JSON.parse(body.filesToDelete) : [];

    for (const f of filesToDelete) {
      try {
        let key = f.url;
        if (key.startsWith('http')) {
          const match = key.match(/iga-project-files\.s3\.me-south-1\.amazonaws\.com\/(.+?)(?:\?|$)/);
          if (match && match[1]) key = match[1];
        }
        await this.s3Service.deleteFile(key);
        console.log('Deleted:', key);
      } catch (err) {
        console.warn('Could not delete:', f.url, err.message);
      }
    }

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

  @Patch(':id/status')
  async updateStatus(@Param('id') id: number, @Body('status') status: ServiceStatus) {
    return this.serviceService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceService.remove(+id);
  }

  @Get('user/:id')
  async getServicesByUser(@Param('id') userId: number): Promise<any[]> {
    const services = await this.serviceService.getAllServicesForUser(userId);
    return services.length ? services : [];
  }

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
