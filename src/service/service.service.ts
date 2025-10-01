import { Injectable } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ServiceService
{
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) { }

  async getAllServicesForUser(userId: number): Promise<Service[]>
  {
    try
    {
      return await this.serviceRepository
        .createQueryBuilder('service')
        .leftJoinAndSelect('service.chief', 'chief')
        .leftJoinAndSelect('service.projectManager', 'projectManager')
        .leftJoinAndSelect('service.assignedResources', 'assignedResources')
        .leftJoinAndSelect('service.backup', 'backup')
        .where('chief.id = :userId OR projectManager.id = :userId OR assignedResources.id = :userId OR backup.id = :userId', { userId })
        .getMany();
    } catch (error)
    {
      console.error('Error fetching services for user:', error);
      throw new Error('Could not fetch services');
    }
  }

  create(createServiceDto: CreateServiceDto)
  {
    return 'This action adds a new service';
  }

  findAll()
  {
    return `This action returns all service`;
  }

  findOne(id: number)
  {
    return `This action returns a #${id} service`;
  }

  update(id: number, updateServiceDto: UpdateServiceDto)
  {
    return `This action updates a #${id} service`;
  }

  remove(id: number)
  {
    return `This action removes a #${id} service`;
  }
}
