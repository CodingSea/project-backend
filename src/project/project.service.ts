import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class ProjectService
{
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>, // ✅ renamed
  ) { }

  // ✅ Create new project
  async create(createProjectDto: CreateProjectDto): Promise<Project>
  {
    const project = this.projectRepository.create(createProjectDto);
    return this.projectRepository.save(project);
  }

  // ✅ Get all projects
  findAll(): Promise<Project[]>
  {
    return this.projectRepository.find();
  }

  async findOne(id: number): Promise<Project>
  {
    const project = await this.projectRepository.findOne({
      where: { projectID: id },
      relations: [ 'services',
        'services.taskBoard',
        'services.taskBoard.cards',
        'services.projectManager',
        'services.chief',
        'services.backup',
        'services.assignedResources' ],
    });

    if (!project)
    {
      throw new NotFoundException(`Project ${id} not found`);
    }

    // Sort services by deadline (ascending order)
    project.services.sort((a, b) =>
    {
      const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity; // Handle undefined deadlines
      const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity; // Handle undefined deadlines
      return deadlineA - deadlineB; // Ascending order
    });

    return project;
  }


  // ✅ Update project by ID
  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project>
  {
    await this.projectRepository.update(id, updateProjectDto);
    const project = await this.projectRepository.findOneBy({ projectID: id });
    if (!project)
    {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }


  // ✅ Delete project
  async remove(id: number): Promise<void>
  {
    await this.projectRepository.delete(id);
  }
}
