import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ServiceService } from 'src/service/service.service';
import { Service } from 'src/service/entities/service.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly serviceRepository: ServiceService,
  ) {}

  // Create new project
  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create(createProjectDto);
    return this.projectRepository.save(project);
  }

  //  Get ALL projects (original behavior)
  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      relations: [
        'services',
        'services.taskBoard',
        'services.taskBoard.cards',
        'services.projectManager',
        'services.chief',
        'services.backup',
        'services.assignedResources',
      ],
    });
  }

  // Paged + filtered projects for listing UI
  async getProjects(
    page: number,
    limit: number,
    status?: string,
    search?: string,
  ): Promise<Project[]> {
    const qb = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.services', 'service')
      .leftJoinAndSelect('service.taskBoard', 'taskBoard')
      .leftJoinAndSelect('taskBoard.cards', 'card')
      .leftJoinAndSelect('service.projectManager', 'projectManager')
      .leftJoinAndSelect('service.chief', 'chief')
      .leftJoinAndSelect('service.backup', 'backup')
      .leftJoinAndSelect('service.assignedResources', 'assignedResources')
      .orderBy('project.projectID', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // status filter (case-insensitive, ignore "all")
    if (status && status.toLowerCase() !== 'all') {
      qb.andWhere('LOWER(project.status) = :status', {
        status: status.toLowerCase(),
      });
    }

    // search by name / description
    if (search) {
      const s = `%${search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(project.name) LIKE :s OR LOWER(project.description) LIKE :s)',
        { s },
      );
    }

    return qb.getMany();
  }

  // count for pagination
  async countProjects(status?: string, search?: string): Promise<number> {
    const qb = this.projectRepository.createQueryBuilder('project');

    if (status && status.toLowerCase() !== 'all') {
      qb.andWhere('LOWER(project.status) = :status', {
        status: status.toLowerCase(),
      });
    }

    if (search) {
      const s = `%${search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(project.name) LIKE :s OR LOWER(project.description) LIKE :s)',
        { s },
      );
    }

    return qb.getCount();
  }

  //Get one project
  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { projectID: id },
      relations: [
        'services',
        'services.taskBoard',
        'services.taskBoard.cards',
        'services.projectManager',
        'services.chief',
        'services.backup',
        'services.assignedResources',
      ],
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    // sort services by nearest deadline
    project.services.sort((a: Service, b: Service) => {
      const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return deadlineA - deadlineB;
    });

    return project;
  }

  //  Update project
  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    await this.projectRepository.update(id, updateProjectDto);
    const project = await this.projectRepository.findOneBy({ projectID: id });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  //  Delete project + its services
  async remove(id: number): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { projectID: id },
      relations: ['services'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    for (const service of project.services) {
      await this.serviceRepository.remove(service.serviceID);
    }

    await this.projectRepository.delete(id);
  }
}
