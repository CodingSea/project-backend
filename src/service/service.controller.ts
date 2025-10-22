import
{
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
import { TasksService } from 'src/tasks/tasks.service';
import { Card } from 'src/card/entities/card.entity';
import { Service } from './entities/service.entity';
import { CreateCardDto } from 'src/card/dto/create-card.dto';
import { UpdateCardDto } from 'src/card/dto/update-card.dto';

@Controller('service')
export class ServiceController
{
  constructor(
    private readonly serviceService: ServiceService,
    private readonly s3Service: S3Service,
    private readonly tasksService: TasksService,
  ) { }

  @Get(':serviceId/tasks')
  async getCards(@Param('serviceId') serviceId: number): Promise<Card[]>
  {
    return this.tasksService.getCardsFromTaskBoard(serviceId);
  }

  @Get('user/:id')
  async getServicesByUser(@Param('id') userId: number): Promise<Service[]>
  {
    const services = await this.serviceService.getAllServicesForUser(userId);

    if (services.length === 0)
    {
      return [];
    }

    return services;
  }

  // ✅ Create service + upload attachments
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async createServiceWithFiles(
    @Body() rawBody: any,
    @UploadedFiles() files: Express.Multer.File[],
  )
  {
    // ✅ Parse numbers and arrays safely
    const dto: CreateServiceDto = {
      name: rawBody.name,
      description: rawBody.description,
      deadline: rawBody.deadline,
      projectId: Number(rawBody.projectId),
      chiefId: Number(rawBody.chiefId),
      managerId: Number(rawBody.managerId),
      resources: Array.isArray(rawBody.resources)
        ? rawBody.resources.map((r: any) => Number(r))
        : rawBody.resources
          ? [ Number(rawBody.resources) ]
          : [],
    };

    // Step 1: Create service in DB
    const service = await this.serviceService.create(dto);

    // Step 2: Upload files to S3 (optional)
    const urls: string[] = [];
    if (files && files.length > 0)
    {
      for (const file of files)
      {
        const key = `services/${service.serviceID}/${Date.now()}-${file.originalname}`;
        const url = await this.s3Service.uploadBuffer(file.buffer, key);
        urls.push(url);
      }

      // Step 3: Save file URLs in DB if there are any
      if (urls.length > 0)
      {
        await this.serviceService.addAttachments(service.serviceID, urls);
      }
    }

    return {
      message: 'Service created successfully',
      service,
      attachments: urls.length > 0 ? urls : undefined, // Return attachments if they exist
    };
  }


  @Get()
  findAll()
  {
    return this.serviceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string)
  {
    return this.serviceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto)
  {
    return this.serviceService.update(+id, updateServiceDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number)
  {
    return this.serviceService.remove(+id);
  }

  @Post(':taskBoardId/cards')
  async createCard(
    @Param('taskBoardId') taskBoardId: number,
    @Body() createCardDto: CreateCardDto
  )
  {
    return await this.tasksService.createCardIfNotExists(taskBoardId, createCardDto);
  }

  @Patch(':taskBoardId/tasks/:cardId')
  async updateCard(
    @Param('taskBoardId') taskBoardId: number,
    @Param('cardId') cardId: number,
    @Body() updateCardDto: UpdateCardDto // Accept the DTO directly
  ): Promise<Card>
  {
    return this.tasksService.updateCard(taskBoardId, cardId, updateCardDto);
  }

  @Delete(':taskBoardId/tasks/:cardId')
  async deleteCard(@Param('cardId') cardId: number): Promise<void>
  {
    return this.tasksService.deleteCard(cardId);
  }
}
