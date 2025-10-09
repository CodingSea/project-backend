import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';
import { TasksService } from 'src/tasks/tasks.service';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';
import { Card } from 'src/card/entities/card.entity';
import { CreateCardDto } from 'src/card/dto/create-card.dto';
import { UpdateCardDto } from 'src/card/dto/update-card.dto';

@Controller('service')
export class ServiceController
{
  constructor(private readonly serviceService: ServiceService, private readonly tasksService: TasksService) { }

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

  @Post()
  create(@Body() createServiceDto: CreateServiceDto)
  {
    return this.serviceService.create(createServiceDto);
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
  remove(@Param('id') id: string)
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
  async updateCard(@Param('cardId') cardId: number, @Body() updateCardDto: UpdateCardDto): Promise<Card>
  {
    return this.tasksService.updateCard(cardId, updateCardDto);
  }

  @Delete(':taskBoardId/tasks/:cardId')
  async deleteCard(@Param('cardId') cardId: number): Promise<void>
  {
    return this.tasksService.deleteCard(cardId);
  }
}
