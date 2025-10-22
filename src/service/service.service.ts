import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Service, ServiceStatus } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entities/user.entity';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';
import { TasksService } from 'src/tasks/tasks.service';

@Injectable()
export class ServiceService
{
  constructor(
    @InjectRepository(Service)
    private readonly svcRepo: Repository<Service>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(TaskBoard)
    private taskBoardRepo: Repository<TaskBoard>,

    private readonly tasksService: TasksService,
  ) { }

  // ✅ CREATE SERVICE
  async create(dto: CreateServiceDto): Promise<Service>
  {
    // Create the Service
    const svc = this.svcRepo.create({
      name: dto.name,
      description: dto.description,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      status: dto.status ?? ServiceStatus.Pending,
      progress: 0,
    });

    // ✅ Project
    const project = await this.projectRepo.findOneBy({ projectID: dto.projectId });
    if (!project) throw new NotFoundException(`Project ${dto.projectId} not found`);
    svc.project = project;

    // ✅ Chief
    const chief = dto.chiefId
      ? await this.userRepo.findOneBy({ id: dto.chiefId })
      : undefined;
    if (dto.chiefId && !chief)
      throw new NotFoundException(`Chief ${dto.chiefId} not found`);
    svc.chief = chief ?? undefined;

    // ✅ Manager
    const manager = dto.managerId
      ? await this.userRepo.findOneBy({ id: dto.managerId })
      : undefined;
    if (dto.managerId && !manager)
      throw new NotFoundException(`Manager ${dto.managerId} not found`);
    svc.projectManager = manager ?? undefined;

    // ✅ Assigned Resources
    if (dto.resources?.length)
    {
      const resources = await this.userRepo.find({
        where: { id: In(dto.resources) },
      });
      svc.assignedResources = resources;
    }

    // ✅ Create TaskBoard
    const taskBoard = new TaskBoard(); // Initialize a new TaskBoard instance
    taskBoard.service = svc; // Set the reference to the service
    svc.taskBoard = taskBoard; // Assign it to the service

    // Save the Service first to get its ID
    const savedService = await this.svcRepo.save(svc);

    // Return the saved Service
    return savedService;
  }

  // ✅ FETCH ALL
  findAll(): Promise<Service[]>
  {
    return this.svcRepo.find({
      relations: [ 'project', 'chief', 'projectManager', 'assignedResources' ],
      order: { serviceID: 'DESC' },
    });
  }

  // ✅ FETCH ONE
  async findOne(id: number): Promise<Service>
  {
    const svc = await this.svcRepo.findOne({
      where: { serviceID: id },
      relations: [ 'project', 'chief', 'projectManager', 'assignedResources', 'comments', 'taskBoard' ],
    });
    if (!svc) throw new NotFoundException(`Service ${id} not found`);
    return svc;
  }

  // ✅ UPDATE
  async update(id: number, dto: UpdateServiceDto): Promise<Service>
  {
    const svc = await this.findOne(id);

    if (dto.name !== undefined) svc.name = dto.name;
    if (dto.description !== undefined) svc.description = dto.description;
    if (dto.deadline !== undefined)
      svc.deadline = dto.deadline ? new Date(dto.deadline) : undefined;
    if (dto.status !== undefined) svc.status = dto.status;

    if (dto.projectId !== undefined)
    {
      const project = await this.projectRepo.findOneBy({ projectID: dto.projectId });
      if (!project) throw new NotFoundException(`Project ${dto.projectId} not found`);
      svc.project = project;
    }

    // ✅ Chief
    if (dto.chiefId !== undefined)
    {
      const chief = dto.chiefId
        ? await this.userRepo.findOneBy({ id: dto.chiefId })
        : undefined;
      svc.chief = chief ?? undefined;
    }

    // ✅ Manager
    if (dto.managerId !== undefined)
    {
      const manager = dto.managerId
        ? await this.userRepo.findOneBy({ id: dto.managerId })
        : undefined;
      svc.projectManager = manager ?? undefined;
    }

    // ✅ Resources
    if (dto.resources !== undefined)
    {
      svc.assignedResources = dto.resources?.length
        ? await this.userRepo.find({ where: { id: In(dto.resources) } })
        : [];
    }

    return this.svcRepo.save(svc);
  }

  async getAllServicesForUser(userId: number): Promise<Service[]>
  {
    try
    {
      return await this.svcRepo
        .createQueryBuilder('service')
        .leftJoinAndSelect('service.chief', 'chief')
        .leftJoinAndSelect('service.projectManager', 'projectManager')
        .leftJoinAndSelect('service.assignedResources', 'assignedResources')
        .leftJoinAndSelect('service.backup', 'backup')
        .leftJoinAndSelect('service.taskBoard', 'taskBoard')
        .where(
          'chief.id = :userId OR projectManager.id = :userId OR assignedResources.id = :userId OR backup.id = :userId',
          { userId }
        )
        .getMany();
    } catch (error)
    {
      console.error('Error fetching services for user:', error);
      throw new Error('Could not fetch services');
    }
  }

  // ✅ DELETE
  async remove(id: number): Promise<void>
  {
    const taskboard = await this.taskBoardRepo.findOne({ where: { service: { serviceID: id } } })
    console.log(taskboard);
    if(taskboard)
    {
      this.tasksService.deleteTaskBoard(taskboard.id);
    }

    await this.svcRepo.delete(id);
  }

  // ✅ Save attachment URLs for a specific service
  async addAttachments(serviceId: number, urls: string[]): Promise<void>
  {
    const svc = await this.findOne(serviceId);
    (svc as any).attachments = urls; // temporary if you don’t have the column yet
    await this.svcRepo.save(svc);
  }

}