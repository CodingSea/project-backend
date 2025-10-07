import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';

@Controller('service')
export class ServiceController
{
  constructor(private readonly serviceService: ServiceService) { }

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
}
