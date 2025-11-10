import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }

 
  @Get('count')
  async countFilteredProjects(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<number> {
    return this.projectService.countProjects(status, search);
  }

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const hasFilters =
      page !== undefined ||
      limit !== undefined ||
      (status !== undefined && status !== '') ||
      (search !== undefined && search !== '');

    if (!hasFilters) {
      return this.projectService.findAll();
    }

    return this.projectService.getProjects(
      Number(page) || 1,
      Number(limit) || 11,
      status,
      search,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.update(+id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectService.remove(+id);
  }
}
