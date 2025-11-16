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
import { Issue } from 'src/issue/entities/issue.entity';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly svcRepo: Repository<Service>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(TaskBoard)
    private readonly taskBoardRepo: Repository<TaskBoard>,

    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,

    private readonly tasksService: TasksService,
  ) {}

  async create(dto: CreateServiceDto): Promise<Service> {
    if (!dto.chiefId) throw new BadRequestException('Chief is required to create a service');

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

    if (dto.managerId) {
      const manager = await this.userRepo.findOneBy({ id: dto.managerId });
      if (!manager) throw new NotFoundException(`Manager ${dto.managerId} not found`);
      svc.projectManager = manager;
    }

    if (dto.resources?.length) {
      svc.assignedResources = await this.userRepo.find({ where: { id: In(dto.resources) } });
    }

    const taskBoard = new TaskBoard();
    taskBoard.service = svc;
    svc.taskBoard = taskBoard;

    const issue = new Issue();
    issue.title = svc.name || '';
    issue.description = svc.description || '';
    issue.status = 'open';
    issue.createdBy = chief;
    issue.category = 'Service';
    svc.issue = issue;

    const saved = await this.svcRepo.save(svc);

    if (saved.taskBoard && saved.taskBoard.service) {
      delete (saved.taskBoard as any)?.service;
    }

    return saved;
  }

  findAll(): Promise<Service[]> {
    return this.svcRepo.find({
      relations: ['project', 'chief', 'projectManager', 'assignedResources'],
      order: { serviceID: 'DESC' },
    });
  }

  // ✅ UPDATED: Supports "hasTasks" filter
  async findAllFiltered(search?: string, status?: string, hasTasks?: string): Promise<Service[]> {
    const qb = this.svcRepo
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.project', 'project')
      .leftJoinAndSelect('service.chief', 'chief')
      .leftJoinAndSelect('service.projectManager', 'projectManager')
      .leftJoinAndSelect('service.assignedResources', 'assignedResources')
      .leftJoinAndSelect('service.taskBoard', 'taskBoard')
      .leftJoinAndSelect('taskBoard.cards', 'cards')
      .orderBy('service.serviceID', 'DESC');

    if (search) {
      qb.andWhere(
        '(LOWER(service.name) LIKE LOWER(:search) OR LOWER(service.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere('service.status = :status', { status });
    }

    // 🟩 New Filter: Has Tasks
    if (hasTasks === 'true') {
      qb.andWhere('cards.id IS NOT NULL');
    } else if (hasTasks === 'false') {
      qb.andWhere('cards.id IS NULL');
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<Service> {
    const svc = await this.svcRepo.findOne({
      where: { serviceID: id },
      relations: [
        'project',
        'chief',
        'projectManager',
        'assignedResources',
        'taskBoard',
        'taskBoard.cards',
        'issue',
      ],
    });
    if (!svc) throw new NotFoundException(`Service ${id} not found`);
    return svc;
  }

  async update(id: number, dto: UpdateServiceDto): Promise<Service> {
    const svc = await this.findOne(id);
    if (dto.name !== undefined) svc.name = dto.name;
    if (dto.description !== undefined) svc.description = dto.description;
    if (dto.deadline !== undefined)
      svc.deadline = dto.deadline ? new Date(dto.deadline) : undefined;
    if (dto.status !== undefined) svc.status = dto.status;

    if (dto.projectId !== undefined) {
      const project = await this.projectRepo.findOneBy({ projectID: dto.projectId });
      if (!project) throw new NotFoundException(`Project ${dto.projectId} not found`);
      svc.project = project;
    }

    if (dto.chiefId !== undefined) {
      const chief = dto.chiefId ? await this.userRepo.findOneBy({ id: dto.chiefId }) : undefined;
      svc.chief = chief ?? undefined;
    }

if (dto.managerId === null || dto.managerId === undefined) {
  svc.projectManager = null;
} else {
  const manager = await this.userRepo.findOneBy({ id: Number(dto.managerId) });
  svc.projectManager = manager ?? null;
}


    if (dto.resources !== undefined) {
      svc.assignedResources = dto.resources?.length
        ? await this.userRepo.find({ where: { id: In(dto.resources) } })
        : [];
    }

    if (dto.files !== undefined) svc.files = dto.files;

    return this.svcRepo.save(svc);
  }

  async getAllServicesForUser(userId: number): Promise<Service[]> {
    const services = await this.svcRepo
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

    return services;
  }

  async remove(id: number): Promise<void> {
    const service = await this.svcRepo.findOne({
      where: { serviceID: id },
      relations: ['taskBoard', 'issue'],
    });
    if (!service) throw new NotFoundException('Service not found');

    await this.svcRepo.remove(service);
    if (service.taskBoard) await this.taskBoardRepo.remove(service.taskBoard);
    if (service.issue) await this.issueRepo.remove(service.issue);
  }

  async updateStatus(id: number, status: ServiceStatus): Promise<Service> {
    const service = await this.svcRepo.findOne({ where: { serviceID: id } });
    if (!service) throw new NotFoundException('Service not found');
    if (!Object.values(ServiceStatus).includes(status as ServiceStatus))
      throw new BadRequestException('Invalid status value');
    service.status = status;
    return this.svcRepo.save(service);
  }
}
