import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    private readonly taskBoardRepo: Repository<TaskBoard>,

    private readonly tasksService: TasksService,
  ) { }

  // ✅ CREATE SERVICE (with full S3 + TaskBoard support)
  async create(dto: CreateServiceDto): Promise<Service>
  {
    if (!dto.chiefId)
    {
      throw new BadRequestException('Chief is required to create a service');
    }

    const svc = this.svcRepo.create({
      name: dto.name,
      description: dto.description,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      status: ServiceStatus.New,
      progress: 0,
      files: dto.files || [],
    });

    const project = await this.projectRepo.findOneBy({ projectID: dto.projectId });
    if (!project) throw new NotFoundException(`Project ${dto.projectId} not found`);
    svc.project = project;

    const chief = await this.userRepo.findOneBy({ id: dto.chiefId });
    if (!chief) throw new NotFoundException(`Chief ${dto.chiefId} not found`);
    svc.chief = chief;

    if (dto.managerId)
    {
      const manager = await this.userRepo.findOneBy({ id: dto.managerId });
      if (!manager) throw new NotFoundException(`Manager ${dto.managerId} not found`);
      svc.projectManager = manager;
    }

    if (dto.resources?.length)
    {
      svc.assignedResources = await this.userRepo.find({ where: { id: In(dto.resources) } });
    }

    // ✅ Create TaskBoard and link it to the service
    const taskBoard = new TaskBoard();
    taskBoard.service = svc;
    svc.taskBoard = taskBoard;

    const saved = await this.svcRepo.save(svc);

    // 🧩 Remove circular reference before returning response
    if (saved.taskBoard && saved.taskBoard.service)
    {
      delete (saved.taskBoard as any)?.service;
    }

    return saved;
  }

    if (saved.taskBoard && (saved.taskBoard as any).service) {
      delete (saved.taskBoard as any).service;
    }

  // ✅ FETCH ALL SERVICES
  findAll(): Promise<Service[]>
  {
    return this.svcRepo.find({
      relations: [ 'project', 'chief', 'projectManager', 'assignedResources' ],
      order: { serviceID: 'DESC' },
    });
  }

  // ✅ FETCH ONE SERVICE
  async findOne(id: number): Promise<Service>
  {
    const svc = await this.svcRepo.findOne({
      where: { serviceID: id },
      relations: [
        'project',
        'chief',
        'projectManager',
        'assignedResources',
        'taskBoard'
      ],
    });

    if (!svc) throw new NotFoundException(`Service ${id} not found`);
    return svc;
  }

  // ✅ UPDATE SERVICE (with files)
  async update(id: number, dto: UpdateServiceDto): Promise<Service>
  {
    const svc = await this.findOne(id);

    if (dto.name !== undefined) svc.name = dto.name;
    if (dto.description !== undefined) svc.description = dto.description;
    if (dto.deadline !== undefined) {
      svc.deadline = dto.deadline ? new Date(dto.deadline) : undefined;
    }
    if (dto.status !== undefined) svc.status = dto.status;

    if (dto.projectId !== undefined)
    {
      const project = await this.projectRepo.findOneBy({ projectID: dto.projectId });
      if (!project) throw new NotFoundException(`Project ${dto.projectId} not found`);
      svc.project = project;
    }

    if (dto.chiefId !== undefined)
    {
      const chief = dto.chiefId
        ? await this.userRepo.findOneBy({ id: dto.chiefId })
        : undefined;
      svc.chief = chief ?? undefined;
    }

    if (dto.managerId !== undefined)
    {
      const manager = dto.managerId
        ? await this.userRepo.findOneBy({ id: dto.managerId })
        : undefined;
      svc.projectManager = manager ?? undefined;
    }

    if (dto.resources !== undefined)
    {
      svc.assignedResources = dto.resources?.length
        ? await this.userRepo.find({ where: { id: In(dto.resources) } })
        : [];
    }

    if (dto.files !== undefined)
    {
      svc.files = dto.files;
    }

    return this.svcRepo.save(svc);
  }

  // ✅ GET ALL SERVICES FOR USER
  async getAllServicesForUser(userId: number): Promise<Service[]>
  {
    return this.svcRepo
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.chief', 'chief')
      .leftJoinAndSelect('service.projectManager', 'projectManager')
      .leftJoinAndSelect('service.assignedResources', 'assignedResources')
      .leftJoinAndSelect('service.backup', 'backup')
      .leftJoinAndSelect('service.taskBoard', 'taskBoard')
      .where(
        'chief.id = :userId OR projectManager.id = :userId OR assignedResources.id = :userId OR backup.id = :userId',
        { userId },
      )
      .getMany();
  }

  // ✅ DELETE SERVICE (also remove taskboard)
  async remove(id: number): Promise<void>
  {
    const service = await this.svcRepo.findOne({
      where: { serviceID: id },
      relations: [ 'taskBoard' ],
    });

    if (!service) throw new NotFoundException('Service not found');

    await this.svcRepo.remove(service);

    if (service.taskBoard)
    {
      await this.taskBoardRepo.remove(service.taskBoard);
    }
  }

  async updateStatus(id: number, status: ServiceStatus): Promise<Service>
  {
    const service = await this.svcRepo.findOne({ where: { serviceID: id } });
    if (!service)
    {
      throw new NotFoundException('Service not found');
    }

    // Check if the provided status is valid
    if (!Object.values(ServiceStatus).includes(status as ServiceStatus))
    {
      throw new BadRequestException('Invalid status value');
    }

    service.status = status;
    return this.svcRepo.save(service);
  }
}
